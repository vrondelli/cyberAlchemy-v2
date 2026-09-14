use crate::strategy::Strategy;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ParameterConstraints {
    #[serde(default)]
    pub allowed_values: Vec<Value>,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ParameterSpec {
    pub name: String,
    pub value_type: String,
    pub required: bool,
    pub default: Option<Value>,
    #[serde(default)]
    pub constraints: ParameterConstraints,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StrategyTemplate {
    pub schema_version: String,
    pub template_id: String,
    pub version: String,
    pub parameters: Vec<ParameterSpec>,
    pub compatibility_requirements: Vec<String>,
    pub strategy: Value,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TemplateInstantiation {
    pub template_id: String,
    pub template_version: String,
    pub parameters: BTreeMap<String, Value>,
    pub selected_adapter_refs: Vec<String>,
    pub strategy: Strategy,
}

impl StrategyTemplate {
    pub fn instantiate(
        &self,
        provided: BTreeMap<String, Value>,
        selected_adapter_refs: Vec<String>,
    ) -> Result<TemplateInstantiation, String> {
        if self.schema_version != "orchestrator-strategy-template/v1"
            || self.template_id.is_empty()
            || self.version.is_empty()
        {
            return Err("TEMPLATE_IDENTITY_INVALID".into());
        }
        let names = self
            .parameters
            .iter()
            .map(|parameter| parameter.name.as_str())
            .collect::<BTreeSet<_>>();
        if names.len() != self.parameters.len()
            || self
                .parameters
                .iter()
                .any(|parameter| parameter.name.is_empty())
        {
            return Err("TEMPLATE_PARAMETER_INVALID_OR_DUPLICATE".into());
        }
        if provided.keys().any(|name| !names.contains(name.as_str())) {
            return Err("TEMPLATE_PARAMETER_UNKNOWN".into());
        }
        if self
            .compatibility_requirements
            .iter()
            .any(|required| !selected_adapter_refs.contains(required))
        {
            return Err("TEMPLATE_ADAPTER_INCOMPATIBLE".into());
        }

        let mut values = BTreeMap::new();
        for spec in &self.parameters {
            let value = provided
                .get(&spec.name)
                .cloned()
                .or_else(|| spec.default.clone());
            if value.is_none() && spec.required {
                return Err(format!("TEMPLATE_PARAMETER_REQUIRED:{}", spec.name));
            }
            if let Some(value) = value {
                if !type_ok(&value, &spec.value_type) {
                    return Err(format!("TEMPLATE_PARAMETER_TYPE:{}", spec.name));
                }
                validate_constraints(&value, &spec.constraints).map_err(|reason| {
                    format!("TEMPLATE_PARAMETER_CONSTRAINT:{}:{reason}", spec.name)
                })?;
                values.insert(spec.name.clone(), value);
            }
        }

        let rendered = render(&self.strategy, &values)?;
        let strategy: Strategy = serde_json::from_value(rendered)
            .map_err(|error| format!("TEMPLATE_STRATEGY_DECODE:{error}"))?;
        strategy.validate()?;
        if strategy
            .adapter_requirements
            .iter()
            .any(|required| !selected_adapter_refs.contains(required))
        {
            return Err("STRATEGY_ADAPTER_INCOMPATIBLE".into());
        }
        Ok(TemplateInstantiation {
            template_id: self.template_id.clone(),
            template_version: self.version.clone(),
            parameters: values,
            selected_adapter_refs,
            strategy,
        })
    }
}

fn type_ok(value: &Value, value_type: &str) -> bool {
    match value_type {
        "string" => value.is_string(),
        "integer" => value.as_i64().is_some(),
        "number" => value.is_number(),
        "boolean" => value.is_boolean(),
        "object" => value.is_object(),
        "array" => value.is_array(),
        _ => false,
    }
}

fn validate_constraints(value: &Value, constraints: &ParameterConstraints) -> Result<(), String> {
    if !constraints.allowed_values.is_empty() && !constraints.allowed_values.contains(value) {
        return Err("VALUE_NOT_ALLOWED".into());
    }
    if let Some(number) = value.as_f64() {
        if constraints.minimum.is_some_and(|minimum| number < minimum) {
            return Err("BELOW_MINIMUM".into());
        }
        if constraints.maximum.is_some_and(|maximum| number > maximum) {
            return Err("ABOVE_MAXIMUM".into());
        }
    }
    if let Some(text) = value.as_str() {
        if constraints
            .min_length
            .is_some_and(|minimum| text.chars().count() < minimum)
        {
            return Err("BELOW_MIN_LENGTH".into());
        }
        if constraints
            .max_length
            .is_some_and(|maximum| text.chars().count() > maximum)
        {
            return Err("ABOVE_MAX_LENGTH".into());
        }
    }
    Ok(())
}

fn render(value: &Value, values: &BTreeMap<String, Value>) -> Result<Value, String> {
    match value {
        Value::String(text) => render_text(text, values),
        Value::Array(values_to_render) => Ok(Value::Array(
            values_to_render
                .iter()
                .map(|item| render(item, values))
                .collect::<Result<_, _>>()?,
        )),
        Value::Object(object) => Ok(Value::Object(
            object
                .iter()
                .map(|(key, value)| Ok((key.clone(), render(value, values)?)))
                .collect::<Result<_, String>>()?,
        )),
        _ => Ok(value.clone()),
    }
}

fn render_text(text: &str, values: &BTreeMap<String, Value>) -> Result<Value, String> {
    if let Some(key) = text
        .strip_prefix("${")
        .and_then(|value| value.strip_suffix('}'))
    {
        if !key.contains('{') && !key.contains('}') {
            return values
                .get(key)
                .cloned()
                .ok_or_else(|| format!("TEMPLATE_PARAMETER_UNRESOLVED:{key}"));
        }
    }
    let mut output = String::new();
    let mut remaining = text;
    while let Some(start) = remaining.find("${") {
        output.push_str(&remaining[..start]);
        let placeholder = &remaining[start + 2..];
        let end = placeholder
            .find('}')
            .ok_or_else(|| "TEMPLATE_PARAMETER_PLACEHOLDER_INVALID".to_owned())?;
        let key = &placeholder[..end];
        let replacement = values
            .get(key)
            .ok_or_else(|| format!("TEMPLATE_PARAMETER_UNRESOLVED:{key}"))?
            .as_str()
            .ok_or_else(|| format!("TEMPLATE_PARAMETER_EMBEDDED_NOT_STRING:{key}"))?;
        output.push_str(replacement);
        remaining = &placeholder[end + 1..];
    }
    output.push_str(remaining);
    Ok(Value::String(output))
}
