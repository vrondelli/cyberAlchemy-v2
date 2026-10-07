use quote::ToTokens;
use serde_json::{json, Value};
use std::io::{self, Read};
use syn::visit::{self, Visit};
use syn::{
    Attribute, Block, Expr, ExprCall, ExprClosure, ExprForLoop, ExprMatch, ExprMethodCall,
    ExprStruct, ImplItem, Item, Local, Pat, Stmt,
};

// This reader inventories explicit syntax only. It does not resolve trait
// dispatch, macros, implicit Drop/Try/IntoIterator calls, or callee effects.
struct Calls {
    sites: Vec<Value>,
    closure_nodes: Vec<Value>,
    call_site_stack: Vec<(usize, usize)>,
    statement: usize,
    closure_depth: usize,
    nested_item_depth: usize,
    attribute_count: usize,
    local_bindings: Vec<Value>,
    struct_initializers: Vec<Value>,
    control_context: Vec<String>,
    scope_path: Vec<usize>,
    next_scope_id: usize,
}

impl Calls {
    fn record(
        &mut self,
        kind: &str,
        callee: String,
        expression: String,
        receiver: Option<String>,
    ) -> usize {
        let ordinal = self.sites.len();
        self.sites.push(json!({
            "ordinal": ordinal,
            "kind": kind,
            "callee_syntax": callee,
            "expression_syntax": expression,
            "receiver_syntax": receiver,
            "pre_tail_statement": self.statement,
            "closure_depth": self.closure_depth,
            "nested_item_depth": self.nested_item_depth,
            "control_context": self.control_context,
            "scope_path": self.scope_path,
        }));
        ordinal
    }
}

impl<'ast> Visit<'ast> for Calls {
    fn visit_block(&mut self, node: &'ast Block) {
        let scope_id = self.next_scope_id;
        self.next_scope_id += 1;
        self.scope_path.push(scope_id);
        visit::visit_block(self, node);
        self.scope_path.pop();
    }

    fn visit_local(&mut self, node: &'ast Local) {
        let (name, type_syntax, mutable) = match &node.pat {
            Pat::Ident(ident) => (
                Some(ident.ident.to_string()),
                None,
                ident.mutability.is_some(),
            ),
            Pat::Type(typed) => match typed.pat.as_ref() {
                Pat::Ident(ident) => (
                    Some(ident.ident.to_string()),
                    Some(typed.ty.to_token_stream().to_string()),
                    ident.mutability.is_some(),
                ),
                _ => (None, Some(typed.ty.to_token_stream().to_string()), false),
            },
            _ => (None, None, false),
        };
        self.local_bindings.push(json!({
            "name": name,
            "type_syntax": type_syntax,
            "mutable": mutable,
            "initializer_syntax": node.init.as_ref().map(|init| init.expr.to_token_stream().to_string()),
            "top_level_statement": self.statement,
            "closure_depth": self.closure_depth,
            "scope_path": self.scope_path,
            "control_context": self.control_context,
        }));
        visit::visit_local(self, node);
    }

    fn visit_expr_struct(&mut self, node: &'ast ExprStruct) {
        self.struct_initializers.push(json!({
            "type_syntax": node.path.to_token_stream().to_string(),
            "fields": node.fields.iter().map(|field| json!({
                "member": field.member.to_token_stream().to_string(),
                "expression_syntax": field.expr.to_token_stream().to_string(),
            })).collect::<Vec<_>>(),
            "top_level_statement": self.statement,
            "closure_depth": self.closure_depth,
            "scope_path": self.scope_path,
            "control_context": self.control_context,
        }));
        visit::visit_expr_struct(self, node);
    }

    fn visit_expr_for_loop(&mut self, node: &'ast ExprForLoop) {
        for attr in &node.attrs {
            self.visit_attribute(attr);
        }
        self.visit_pat(&node.pat);
        self.visit_expr(&node.expr);
        self.control_context.push(format!(
            "for {} in {}",
            node.pat.to_token_stream(),
            node.expr.to_token_stream()
        ));
        self.visit_block(&node.body);
        self.control_context.pop();
    }

    fn visit_expr_match(&mut self, node: &'ast ExprMatch) {
        for attr in &node.attrs {
            self.visit_attribute(attr);
        }
        self.visit_expr(&node.expr);
        for (index, arm) in node.arms.iter().enumerate() {
            self.control_context.push(format!(
                "match {} arm {} {}",
                node.expr.to_token_stream(),
                index,
                arm.pat.to_token_stream()
            ));
            for attr in &arm.attrs {
                self.visit_attribute(attr);
            }
            self.visit_pat(&arm.pat);
            if let Some((_, guard)) = &arm.guard {
                self.visit_expr(guard);
            }
            self.visit_expr(&arm.body);
            self.control_context.pop();
        }
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        let ordinal = self.record(
            "function",
            node.func.to_token_stream().to_string(),
            node.to_token_stream().to_string(),
            None,
        );
        for attr in &node.attrs {
            self.visit_attribute(attr);
        }
        self.visit_expr(&node.func);
        for (argument_index, argument) in node.args.iter().enumerate() {
            self.call_site_stack.push((ordinal, argument_index));
            self.visit_expr(argument);
            self.call_site_stack.pop();
        }
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let ordinal = self.record(
            "method",
            node.method.to_string(),
            node.to_token_stream().to_string(),
            Some(node.receiver.to_token_stream().to_string()),
        );
        for attr in &node.attrs {
            self.visit_attribute(attr);
        }
        self.visit_expr(&node.receiver);
        self.visit_ident(&node.method);
        if let Some(turbofish) = &node.turbofish {
            self.visit_angle_bracketed_generic_arguments(turbofish);
        }
        for (argument_index, argument) in node.args.iter().enumerate() {
            self.call_site_stack.push((ordinal, argument_index));
            self.visit_expr(argument);
            self.call_site_stack.pop();
        }
    }

    fn visit_macro(&mut self, node: &'ast syn::Macro) {
        self.record(
            "macro",
            node.path.to_token_stream().to_string(),
            node.to_token_stream().to_string(),
            None,
        );
        visit::visit_macro(self, node);
    }

    fn visit_expr_closure(&mut self, node: &'ast ExprClosure) {
        let ordinal = self.closure_nodes.len();
        let (parent_call_site_ordinal, parent_argument_index) = self
            .call_site_stack
            .last()
            .map(|(site, argument)| (Some(*site), Some(*argument)))
            .unwrap_or((None, None));
        let body_top_level_statements = match node.body.as_ref() {
            Expr::Block(block) => Some(
                block
                    .block
                    .stmts
                    .iter()
                    .map(|stmt| stmt.to_token_stream().to_string())
                    .collect::<Vec<_>>(),
            ),
            _ => None,
        };
        self.closure_nodes.push(json!({
            "ordinal": ordinal,
            "parent_call_site_ordinal": parent_call_site_ordinal,
            "parent_argument_index": parent_argument_index,
            "closure_syntax": node.to_token_stream().to_string(),
            "parameters": node.inputs.iter().map(|input| input.to_token_stream().to_string()).collect::<Vec<_>>(),
            "body_kind": if body_top_level_statements.is_some() { "block" } else { "expression" },
            "body_syntax": node.body.to_token_stream().to_string(),
            "body_top_level_statements": body_top_level_statements,
            "modifiers": {
                "const": node.constness.is_some(),
                "static": node.movability.is_some(),
                "async": node.asyncness.is_some(),
                "move": node.capture.is_some(),
                "lifetimes_syntax": node.lifetimes.as_ref().map(|value| value.to_token_stream().to_string()),
            },
            "attributes_present": node.attrs.iter().filter(|attr| !attr.path().is_ident("doc")).count(),
            "nested_site_ordinals": [],
        }));
        let site_start = self.sites.len();
        // The enclosing argument context is syntactic containment, not proof
        // that this closure is a direct argument. Calls inside its body must
        // not inherit that enclosing context.
        let enclosing_calls = std::mem::take(&mut self.call_site_stack);
        self.closure_depth += 1;
        visit::visit_expr_closure(self, node);
        self.closure_depth -= 1;
        self.call_site_stack = enclosing_calls;
        self.closure_nodes[ordinal]["nested_site_ordinals"] =
            json!((site_start..self.sites.len()).collect::<Vec<_>>());
    }

    fn visit_item(&mut self, node: &'ast Item) {
        self.nested_item_depth += 1;
        visit::visit_item(self, node);
        self.nested_item_depth -= 1;
    }

    fn visit_attribute(&mut self, node: &'ast Attribute) {
        if !node.path().is_ident("doc") {
            self.attribute_count += 1;
        }
        visit::visit_attribute(self, node);
    }

    fn visit_expr(&mut self, node: &'ast Expr) {
        if let Expr::Verbatim(tokens) = node {
            self.record("opaque-verbatim", String::new(), tokens.to_string(), None);
        } else {
            visit::visit_expr(self, node);
        }
    }
}

fn selected_sites(block: &Block, statement_count: usize, attributes_present: usize) -> Value {
    let mut calls = Calls {
        sites: Vec::new(),
        closure_nodes: Vec::new(),
        call_site_stack: Vec::new(),
        statement: 0,
        closure_depth: 0,
        nested_item_depth: 0,
        attribute_count: attributes_present,
        local_bindings: Vec::new(),
        struct_initializers: Vec::new(),
        control_context: Vec::new(),
        scope_path: Vec::new(),
        next_scope_id: 0,
    };
    for (index, stmt) in block.stmts[..statement_count].iter().enumerate() {
        calls.statement = index;
        calls.visit_stmt(stmt);
    }
    json!({
        "selected_statement_count": statement_count,
        "selected_parsed_call_nodes_exhaustive": true,
        "transitive_effect_closure": false,
        "implicit_operations_covered": false,
        "macro_token_trees_expanded": false,
        "attributes_present": calls.attribute_count,
        "sites": calls.sites,
        "closure_nodes": calls.closure_nodes,
        "local_bindings": calls.local_bindings,
        "struct_initializers": calls.struct_initializers,
        "top_level_statements": block.stmts[..statement_count].iter()
            .map(|stmt| stmt.to_token_stream().to_string()).collect::<Vec<_>>(),
    })
}

fn inventory(source: &str, selector: Option<&Value>) -> Result<Value, String> {
    let file = syn::parse_file(source).map_err(|error| format!("parse: {error}"))?;
    if let Some(selector) = selector {
        let kind = selector["kind"].as_str().ok_or("selector-kind")?;
        let name = selector["name"].as_str().ok_or("selector-name")?;
        let mut selected: Vec<(&Block, usize, String, Option<String>, Vec<String>)> = Vec::new();
        for item in &file.items {
            match item {
                Item::Fn(function) if kind == "free" && function.sig.ident == name => {
                    selected.push((
                        &function.block,
                        function
                            .attrs
                            .iter()
                            .filter(|attr| !attr.path().is_ident("doc"))
                            .count(),
                        name.into(),
                        None,
                        function
                            .sig
                            .inputs
                            .iter()
                            .map(|input| input.to_token_stream().to_string())
                            .collect(),
                    ));
                }
                Item::Impl(implementation) if kind == "impl" => {
                    let self_type = implementation.self_ty.to_token_stream().to_string();
                    let trait_name = implementation
                        .trait_
                        .as_ref()
                        .map(|(_, path, _)| path.to_token_stream().to_string());
                    if selector["self_type"].as_str() != Some(self_type.as_str())
                        || selector["trait"].as_str() != trait_name.as_deref()
                    {
                        continue;
                    }
                    for member in &implementation.items {
                        if let ImplItem::Fn(method) = member {
                            if method.sig.ident == name {
                                selected.push((
                                    &method.block,
                                    method
                                        .attrs
                                        .iter()
                                        .filter(|attr| !attr.path().is_ident("doc"))
                                        .count(),
                                    self_type.clone(),
                                    trait_name.clone(),
                                    method
                                        .sig
                                        .inputs
                                        .iter()
                                        .map(|input| input.to_token_stream().to_string())
                                        .collect(),
                                ));
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        if selected.len() != 1 {
            return Err(format!("selector-match-count:{}", selected.len()));
        }
        let (block, attributes, owner, trait_name, parameters) = &selected[0];
        let mut result = selected_sites(block, block.stmts.len(), *attributes);
        result["schema_version"] =
            json!("auth-foundation.v4b-explicit-call-inventory/v1-candidate");
        result["function"] = json!(name);
        result["owner_syntax"] = json!(owner);
        result["trait_syntax"] = json!(trait_name);
        result["selector"] = selector.clone();
        result["parameters"] = json!(parameters);
        return Ok(result);
    }
    let mut functions = file.items.iter().filter_map(|item| match item {
        Item::Fn(function) if function.sig.ident == "authorize_in_epoch" => Some(function),
        _ => None,
    });
    let function = functions.next().ok_or("missing-authorize-in-epoch")?;
    if functions.next().is_some() {
        return Err("ambiguous-authorize-in-epoch".into());
    }
    let tails: Vec<usize> = function.block.stmts.iter().enumerate().filter_map(|(index, stmt)| {
        match stmt {
            Stmt::Local(local) if matches!(&local.pat, Pat::Ident(ident) if ident.ident == "routes") => Some(index),
            _ => None,
        }
    }).collect();
    if tails.len() != 1 {
        return Err(format!("routes-tail-count:{}", tails.len()));
    }
    let mut result = selected_sites(
        &function.block,
        tails[0],
        function
            .attrs
            .iter()
            .filter(|attr| !attr.path().is_ident("doc"))
            .count(),
    );
    result["schema_version"] = json!("auth-foundation.v4b-explicit-call-inventory/v1-candidate");
    result["function"] = json!("authorize_in_epoch");
    result["pre_tail_statement_count"] = json!(tails[0]);
    result["tail_top_level_statements"] = json!(function.block.stmts[tails[0]..]
        .iter()
        .map(|stmt| stmt.to_token_stream().to_string())
        .collect::<Vec<_>>());
    Ok(result)
}

// This is a syntactic receiver-chain projection, not proof of trait dispatch,
// row production, callback execution, or the effects of an adapter.
struct ConsumerChains {
    chains: Vec<Value>,
    ancestors: Vec<ConsumerAncestor>,
    statement: usize,
    closure_depth: usize,
}

struct ConsumerAncestor {
    step: String,
    expression_syntax: Option<String>,
    receiver_edge: bool,
}

impl ConsumerChains {
    fn push_and_visit<'ast>(&mut self, ancestor: ConsumerAncestor, child: &'ast Expr) {
        self.ancestors.push(ancestor);
        self.visit_expr(child);
        self.ancestors.pop();
    }

    fn record_query_map(&mut self, node: &ExprMethodCall) {
        let mut steps = vec!["query_map".to_owned()];
        let mut collect_expression_syntax = None;
        for ancestor in self.ancestors.iter().rev() {
            if !ancestor.receiver_edge {
                break;
            }
            steps.push(ancestor.step.clone());
            if ancestor.step == "collect" {
                collect_expression_syntax = ancestor.expression_syntax.clone();
                break;
            }
        }
        self.chains.push(json!({
            "query_map_expression_syntax": node.to_token_stream().to_string(),
            "collect_expression_syntax": collect_expression_syntax,
            "steps": steps,
            "top_level_statement": self.statement,
            "closure_depth": self.closure_depth,
        }));
    }
}

impl<'ast> Visit<'ast> for ConsumerChains {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::MethodCall(method) => self.visit_expr_method_call(method),
            Expr::Try(try_expr) => {
                self.push_and_visit(
                    ConsumerAncestor {
                        step: "try".into(),
                        expression_syntax: None,
                        receiver_edge: true,
                    },
                    &try_expr.expr,
                );
            }
            Expr::Paren(paren) => self.visit_expr(&paren.expr),
            Expr::Group(group) => self.visit_expr(&group.expr),
            _ => {
                // All other expression forms are opaque for receiver flow.
                // Their descendants remain discoverable as separate queries.
                self.ancestors.push(ConsumerAncestor {
                    step: "opaque".into(),
                    expression_syntax: None,
                    receiver_edge: false,
                });
                visit::visit_expr(self, node);
                self.ancestors.pop();
            }
        }
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let method = node.method.to_string();
        if method == "query_map" {
            self.record_query_map(node);
        }
        self.push_and_visit(
            ConsumerAncestor {
                step: method,
                expression_syntax: Some(node.to_token_stream().to_string()),
                receiver_edge: true,
            },
            &node.receiver,
        );
        for argument in &node.args {
            self.push_and_visit(
                ConsumerAncestor {
                    step: "argument".into(),
                    expression_syntax: None,
                    receiver_edge: false,
                },
                argument,
            );
        }
    }

    fn visit_expr_closure(&mut self, node: &'ast ExprClosure) {
        self.closure_depth += 1;
        visit::visit_expr_closure(self, node);
        self.closure_depth -= 1;
    }
}

fn consumer_chain(source: &str, selector: &Value) -> Result<Value, String> {
    let file = syn::parse_file(source).map_err(|error| format!("parse: {error}"))?;
    let kind = selector["kind"].as_str().ok_or("selector-kind")?;
    let name = selector["name"].as_str().ok_or("selector-name")?;
    let mut selected: Vec<&Block> = Vec::new();
    for item in &file.items {
        match item {
            Item::Fn(function) if kind == "free" && function.sig.ident == name => {
                selected.push(&function.block);
            }
            Item::Impl(implementation) if kind == "impl" => {
                let self_type = implementation.self_ty.to_token_stream().to_string();
                let trait_name = implementation
                    .trait_
                    .as_ref()
                    .map(|(_, path, _)| path.to_token_stream().to_string());
                if selector["self_type"].as_str() != Some(self_type.as_str())
                    || selector["trait"].as_str() != trait_name.as_deref()
                {
                    continue;
                }
                for member in &implementation.items {
                    if let ImplItem::Fn(method) = member {
                        if method.sig.ident == name {
                            selected.push(&method.block);
                        }
                    }
                }
            }
            _ => {}
        }
    }
    if selected.len() != 1 {
        return Err(format!("selector-match-count:{}", selected.len()));
    }
    let mut visitor = ConsumerChains {
        chains: Vec::new(),
        ancestors: Vec::new(),
        statement: 0,
        closure_depth: 0,
    };
    for (index, statement) in selected[0].stmts.iter().enumerate() {
        visitor.statement = index;
        visitor.visit_stmt(statement);
    }
    Ok(json!({
        "schema_version": "auth-foundation.v4b-query-map-consumer-chain/v1-candidate",
        "function": name,
        "selector": selector,
        "chains": visitor.chains,
    }))
}

fn main() {
    let mut source = String::new();
    if let Err(error) = io::stdin().read_to_string(&mut source) {
        eprintln!("AUTH_V4B_CALL_INVENTORY:stdin:{error}");
        std::process::exit(2);
    }
    let arguments: Vec<String> = std::env::args().skip(1).collect();
    let (selector, consumer_mode) = match arguments.as_slice() {
        [] => (None, false),
        [flag, value] if flag == "--selector" => match serde_json::from_str::<Value>(value) {
            Ok(value) => (Some(value), false),
            Err(error) => {
                eprintln!("AUTH_V4B_CALL_INVENTORY:selector-json:{error}");
                std::process::exit(2);
            }
        },
        [mode, flag, value] if mode == "--consumer-chain" && flag == "--selector" => {
            match serde_json::from_str::<Value>(value) {
                Ok(value) => (Some(value), true),
                Err(error) => {
                    eprintln!("AUTH_V4B_CALL_INVENTORY:selector-json:{error}");
                    std::process::exit(2);
                }
            }
        }
        _ => {
            eprintln!("AUTH_V4B_CALL_INVENTORY:arguments");
            std::process::exit(2);
        }
    };
    let result = if consumer_mode {
        consumer_chain(&source, selector.as_ref().expect("mode requires selector"))
    } else {
        inventory(&source, selector.as_ref())
    };
    match result {
        Ok(value) => println!("{value}"),
        Err(error) => {
            eprintln!("AUTH_V4B_CALL_INVENTORY:{error}");
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{consumer_chain, inventory};
    use serde_json::json;

    #[test]
    fn empty_closure_is_bound_to_its_call_argument() {
        let result = inventory(
            "fn f() { call(request, |_| {}); }",
            Some(&json!({
                "kind": "free", "name": "f"
            })),
        )
        .expect("fixture parses");
        assert_eq!(result["sites"].as_array().unwrap().len(), 1);
        assert_eq!(result["closure_nodes"].as_array().unwrap().len(), 1);
        let closure = &result["closure_nodes"][0];
        assert_eq!(closure["parent_call_site_ordinal"], 0);
        assert_eq!(closure["parent_argument_index"], 1);
        assert_eq!(closure["closure_syntax"], "| _ | { }");
        assert_eq!(closure["body_kind"], "block");
        assert_eq!(closure["body_top_level_statements"], json!([]));
        assert_eq!(closure["nested_site_ordinals"], json!([]));
    }

    #[test]
    fn nested_closure_body_does_not_inherit_outer_call_parent() {
        let result = inventory(
            "fn f() { outer(|| { let a = || inner(); nested(a); }); }",
            Some(&json!({ "kind": "free", "name": "f" })),
        )
        .expect("fixture parses");
        let closures = result["closure_nodes"].as_array().unwrap();
        assert_eq!(closures.len(), 2);
        assert_eq!(closures[0]["parent_call_site_ordinal"], 0);
        assert_eq!(closures[0]["parent_argument_index"], 0);
        assert_eq!(closures[0]["nested_site_ordinals"], json!([1, 2]));
        assert!(closures[1]["parent_call_site_ordinal"].is_null());
        assert!(closures[1]["parent_argument_index"].is_null());
        assert_eq!(closures[1]["nested_site_ordinals"], json!([1]));
    }

    #[test]
    fn consumer_chain_follows_only_structural_receiver_ancestry() {
        let selector = json!({ "kind": "free", "name": "f" });
        let result = consumer_chain(
            "fn f() { let rows = stmt.query_map([], |row| row.get(0)).map_err(error)?.map(convert).collect::<Result<Vec<_>, _>>()?; }",
            &selector,
        )
        .expect("fixture parses");
        assert_eq!(result["chains"].as_array().unwrap().len(), 1);
        let chain = &result["chains"][0];
        assert_eq!(
            chain["steps"],
            json!(["query_map", "map_err", "try", "map", "collect"])
        );
        assert_eq!(chain["top_level_statement"], 0);
        assert_eq!(chain["closure_depth"], 0);
        assert!(chain["collect_expression_syntax"]
            .as_str()
            .unwrap()
            .contains("collect"));
    }

    #[test]
    fn hostile_take_adapter_remains_visible() {
        let result = consumer_chain(
            "fn f() { stmt.query_map([], |row| row.get(0)).take(0).collect::<Vec<_>>(); }",
            &json!({ "kind": "free", "name": "f" }),
        )
        .expect("fixture parses");
        assert_eq!(
            result["chains"][0]["steps"],
            json!(["query_map", "take", "collect"])
        );
    }

    #[test]
    fn argument_or_control_containment_is_not_receiver_flow() {
        let result = consumer_chain(
            "fn f() { consume(stmt.query_map([], |row| row.get(0))).collect::<Vec<_>>(); if ready { stmt.query_map([], |row| row.get(0)) } else { stmt.query_map([], |row| row.get(0)) }.collect::<Vec<_>>(); }",
            &json!({ "kind": "free", "name": "f" }),
        )
        .expect("fixture parses");
        assert_eq!(result["chains"].as_array().unwrap().len(), 3);
        for chain in result["chains"].as_array().unwrap() {
            assert_eq!(chain["steps"], json!(["query_map"]));
            assert!(chain["collect_expression_syntax"].is_null());
        }
    }

    #[test]
    fn normal_inventory_projection_is_unchanged_by_new_mode() {
        let result = inventory(
            "fn f() { stmt.query_map([], |row| row.get(0)).collect::<Vec<_>>(); }",
            Some(&json!({ "kind": "free", "name": "f" })),
        )
        .expect("fixture parses");
        assert_eq!(
            result["schema_version"],
            "auth-foundation.v4b-explicit-call-inventory/v1-candidate"
        );
        assert!(result.get("chains").is_none());
    }
}
