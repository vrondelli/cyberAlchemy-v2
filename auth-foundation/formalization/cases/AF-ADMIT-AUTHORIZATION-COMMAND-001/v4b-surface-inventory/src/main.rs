use quote::ToTokens;
use serde_json::{json, Value};
use std::io::{self, Read};
use syn::{Attribute, ImplItem, Item, TraitItem};

// Syntax inventory only. No cfg expansion, type resolution, or effect closure.
fn surface(source: &str) -> Result<Value, String> {
    fn cfg(attrs: &[Attribute]) -> Vec<String> {
        attrs.iter()
            .filter(|attr| attr.path().is_ident("cfg") || attr.path().is_ident("cfg_attr"))
            .map(|attr| attr.to_token_stream().to_string())
            .collect()
    }
    fn walk(
        items: &[Item],
        module: &[String],
        inherited_cfg: &[String],
        rows: &mut Vec<Value>,
        opaque: &mut Vec<Value>,
    ) {
        for item in items {
            match item {
                Item::Fn(function) => {
                    let mut conditions = inherited_cfg.to_vec();
                    conditions.extend(cfg(&function.attrs));
                    rows.push(json!({
                        "kind": "free", "module": module, "owner": null,
                        "name": function.sig.ident.to_string(),
                        "visibility": function.vis.to_token_stream().to_string(),
                        "signature": function.sig.to_token_stream().to_string(),
                        "return_type": function.sig.output.to_token_stream().to_string(),
                        "cfg": conditions,
                    }));
                }
                Item::Impl(implementation) => {
                    let mut conditions = inherited_cfg.to_vec();
                    conditions.extend(cfg(&implementation.attrs));
                    let owner = implementation.self_ty.to_token_stream().to_string();
                    let trait_path = implementation
                        .trait_
                        .as_ref()
                        .map(|(_, path, _)| path.to_token_stream().to_string());
                    for member in &implementation.items {
                        if let ImplItem::Fn(method) = member {
                            let mut method_conditions = conditions.clone();
                            method_conditions.extend(cfg(&method.attrs));
                            rows.push(json!({
                                "kind": "impl", "module": module, "owner": owner,
                                "trait": trait_path, "name": method.sig.ident.to_string(),
                                "visibility": method.vis.to_token_stream().to_string(),
                                "signature": method.sig.to_token_stream().to_string(),
                                "return_type": method.sig.output.to_token_stream().to_string(),
                                "cfg": method_conditions,
                            }));
                        }
                    }
                }
                Item::Trait(trait_item) => {
                    let mut conditions = inherited_cfg.to_vec();
                    conditions.extend(cfg(&trait_item.attrs));
                    for member in &trait_item.items {
                        if let TraitItem::Fn(method) = member {
                            let mut method_conditions = conditions.clone();
                            method_conditions.extend(cfg(&method.attrs));
                            rows.push(json!({
                                "kind": "trait", "module": module,
                                "owner": trait_item.ident.to_string(),
                                "name": method.sig.ident.to_string(),
                                "visibility": trait_item.vis.to_token_stream().to_string(),
                                "signature": method.sig.to_token_stream().to_string(),
                                "return_type": method.sig.output.to_token_stream().to_string(),
                                "cfg": method_conditions,
                            }));
                        }
                    }
                }
                Item::Mod(child) => {
                    let mut conditions = inherited_cfg.to_vec();
                    conditions.extend(cfg(&child.attrs));
                    if let Some((_, members)) = &child.content {
                        let mut child_module = module.to_vec();
                        child_module.push(child.ident.to_string());
                        walk(members, &child_module, &conditions, rows, opaque);
                    } else {
                        opaque.push(json!({"kind": "external-module", "module": module,
                            "syntax": child.ident.to_string(), "cfg": conditions}));
                    }
                }
                Item::Use(use_item) if !use_item.vis.to_token_stream().to_string().is_empty() => {
                    opaque.push(json!({"kind": "re-export", "module": module,
                        "syntax": use_item.to_token_stream().to_string(),
                        "cfg": inherited_cfg}));
                }
                Item::Macro(macro_item) => {
                    opaque.push(json!({"kind": "macro", "module": module,
                        "syntax": macro_item.mac.path.to_token_stream().to_string(),
                        "cfg": inherited_cfg}));
                }
                Item::ForeignMod(foreign) => {
                    opaque.push(json!({"kind": "foreign", "module": module,
                        "syntax": foreign.to_token_stream().to_string(),
                        "cfg": inherited_cfg}));
                }
                _ => {}
            }
        }
    }
    let file = syn::parse_file(source).map_err(|error| format!("parse: {error}"))?;
    let mut rows = Vec::new();
    let mut opaque = Vec::new();
    walk(&file.items, &[], &[], &mut rows, &mut opaque);
    Ok(json!({
        "schema_version": "auth-foundation.v4b-rust-surface/v1-candidate",
        "functions": rows, "opaque": opaque,
        "cfg_expanded": false, "types_resolved": false,
        "transitive_effect_closure": false,
    }))
}

fn main() {
    let mut source = String::new();
    if let Err(error) = io::stdin().read_to_string(&mut source) {
        eprintln!("AUTH_V4B_SURFACE:stdin:{error}");
        std::process::exit(2);
    }
    match surface(&source) {
        Ok(value) => println!("{value}"),
        Err(error) => {
            eprintln!("AUTH_V4B_SURFACE:{error}");
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::surface;
    use serde_json::json;

    #[test]
    fn public_private_trait_cfg_and_opaque_edges_are_visible() {
        let result = surface("pub use private::authorize; mod inner { #[cfg(test)] pub fn authorize() -> Decision {} } fn hidden() {} pub trait Engine { fn decide(&self) -> Decision; } struct S; impl S { pub fn authorize(&self) {} } extern \"C\" { fn foreign(); } macro_rules! generated { () => {}; }")
            .expect("fixture parses");
        let rows = result["functions"].as_array().unwrap();
        assert_eq!(rows.len(), 4);
        assert!(rows.iter().any(|row| row["name"] == "authorize"
            && row["module"] == json!(["inner"])
            && row["cfg"].as_array().unwrap().iter().any(|item| item.as_str().unwrap().contains("test"))));
        assert!(rows.iter().any(|row| row["name"] == "hidden" && row["visibility"] == ""));
        assert!(rows.iter().any(|row| row["kind"] == "trait" && row["name"] == "decide"));
        let opaque = result["opaque"].as_array().unwrap();
        assert!(opaque.iter().any(|row| row["kind"] == "re-export"));
        assert!(opaque.iter().any(|row| row["kind"] == "foreign"));
        assert!(opaque.iter().any(|row| row["kind"] == "macro"));
        assert_eq!(result["transitive_effect_closure"], false);
    }
}
