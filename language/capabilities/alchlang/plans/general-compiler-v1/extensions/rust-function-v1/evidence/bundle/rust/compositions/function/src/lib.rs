#![allow(non_snake_case,dead_code,unused_parens)]
#[path="../../../src/domainspec/rust/quantity-price/line-subtotal.rs"] mod core_LineSubtotal;


use serde_json::{json,Value};
use std::collections::BTreeMap;
use sha2::{Sha256,Digest};
pub type R=Result<Value,String>;
fn model()->Value{serde_json::from_str(include_str!("../function.json")).expect("generated model")}
fn ontology()->Value{serde_json::from_str(include_str!("../ontology.json")).expect("generated ontology")}
fn bindings()->Value{serde_json::from_str(include_str!("../bindings.json")).expect("generated bindings")}
fn hash(bytes:&[u8])->String{format!("{:x}",Sha256::digest(bytes))}
fn string(v:Value)->Result<String,String>{v.as_str().map(str::to_owned).ok_or("FUNCTION_TYPE".into())}
fn boolean(v:Value)->Result<bool,String>{v.as_bool().ok_or("FUNCTION_BOOLEAN".into())}
fn list(v:Value)->Result<Vec<Value>,String>{v.as_array().cloned().ok_or("FUNCTION_LIST".into())}
fn uint64(v:Value)->Result<u64,String>{
 if let Some(n)=v.as_u64(){return Ok(n);}
 if let Some(s)=v.as_str(){if !s.is_empty() && s.bytes().all(|c|c.is_ascii_digit()) && (s=="0"||!s.starts_with('0')) {return s.parse().map_err(|_|"FUNCTION_UINT64".into());}}
 Err("FUNCTION_UINT64".into())
}
fn compare(a:Value,b:Value)->Result<i8,String>{let a=a.as_i64().map(i128::from).or_else(||a.as_u64().map(i128::from)).ok_or("FUNCTION_TYPE")?;let b=b.as_i64().map(i128::from).or_else(||b.as_u64().map(i128::from)).ok_or("FUNCTION_TYPE")?;Ok(if a<b{-1}else if a>b{1}else{0})}
fn decimal(s:String,scale:u32)->Result<u64,String>{let parts:Vec<_>=s.split('.').collect();if parts.len()>2||parts[0].is_empty()||!parts[0].bytes().all(|c|c.is_ascii_digit())||(parts[0].starts_with('0')&&parts[0]!="0"){return Err("FUNCTION_DECIMAL".into());}let f=parts.get(1).copied().unwrap_or("");if parts.len()==2&&(scale==0||f.is_empty()||f.len()>scale as usize||!f.bytes().all(|c|c.is_ascii_digit())){return Err("FUNCTION_DECIMAL".into());}let whole:u64=parts[0].parse().map_err(|_|"FUNCTION_UINT64")?;let fraction:u64=format!("{f:0<width$}",width=scale as usize).parse().unwrap_or(0);whole.checked_mul(10u64.pow(scale)).and_then(|n|n.checked_add(fraction)).ok_or("FUNCTION_UINT64".into())}
fn money(n:u64,scale:u32)->String{if scale==0{return n.to_string();}let base=10u64.pow(scale);format!("{}.{:0width$}",n/base,n%base,width=scale as usize)}
fn one(v:Value)->R{let mut rows=list(v)?;if rows.len()!=1{return Err("DS_QUERY_CARDINALITY".into());}Ok(rows.remove(0))}
fn distinct(v:Value)->R{let mut out=Vec::new();for v in list(v)?{if !out.contains(&v){out.push(v);}}Ok(Value::Array(out))}
fn sorted(v:Value)->R{let mut rows=list(v)?;rows.sort_by(|a,b|if let (Some(a),Some(b))=(a.as_str(),b.as_str()){a.encode_utf16().cmp(b.encode_utf16())}else{compare(a.clone(),b.clone()).expect("typed scalar").cmp(&0)});Ok(Value::Array(rows))}
fn calculation_error(e:String)->String{if e.contains("subtract range"){"CALCULATION_UNDERFLOW"}else if e.contains("range error"){"CALCULATION_OVERFLOW"}else if e.contains("division by zero"){"CALCULATION_DIVIDE_BY_ZERO"}else if e.contains("inexact"){"CALCULATION_INEXACT"}else{"EVALUATION_FAILED"}.into()}
fn normalize(v:Value)->Value{match v{Value::Array(rows)=>Value::Array(rows.into_iter().map(normalize).collect()),Value::Object(fields)=>Value::Object(fields.into_iter().map(|(k,v)|(k,normalize(v))).collect()),Value::Number(n)=>{if n.is_f64(){if let Some(f)=n.as_f64(){if f.fract()==0.0&&f.abs()<=9007199254740991.0{return json!(f as i64);}}}Value::Number(n)},other=>other}}
struct Context{roots:Value,memo:BTreeMap<String,Value>,events:Vec<Value>,tracing:bool,truncated:bool,bytes:usize}
impl Context{
 fn new(input:Value,tracing:bool)->Self{Self{roots:json!({"input":normalize(input)}),memo:BTreeMap::new(),events:vec![],tracing,truncated:false,bytes:0}}
 fn emit(&mut self,mut e:Value){if !self.tracing{return;}let o=ontology();if let Some(name)=e["declaration"].as_str(){if let Some(n)=o["nodes"].as_array().unwrap().iter().find(|n|n["name"]==name){e["definition"]=n.clone();}}let size=e.to_string().len();if self.events.len()>=10000||self.bytes+size>2097152{self.truncated=true;return;}self.bytes+=size;self.events.push(e);}
 fn observed(&mut self,name:&str,kind:&str,r:&R){match r{Ok(v)=>{let mut e=json!({"kind":"node-result","declaration":name,"node_kind":kind});if kind=="Query"{e["count"]=json!(v.as_array().unwrap().len());}else{e["value"]=v.clone();}self.emit(e);},Err(code)=>self.emit(json!({"kind":"node-error","declaration":name,"node_kind":kind,"code":code}))}}
}
fn schema(m:&Value,name:&str,v:&Value,depth:usize)->Result<(),String>{
 if depth>32{return Err("FUNCTION_DEPTH".into());}let fields=m["schemas"][name].as_object().ok_or("FUNCTION_SCHEMA")?;let record=v.as_object().ok_or("FUNCTION_RECORD")?;
 if record.keys().any(|k|!fields.contains_key(k)){return Err("FUNCTION_UNKNOWN_FIELD".into());}
 for (key,s) in fields{let Some(v)=record.get(key)else{if s["optional"]==true{continue;}return Err("FUNCTION_REQUIRED".into());};
  if v.is_null(){if s["nullable"]!=true{return Err("FUNCTION_TYPE".into());}if s.get("const").is_some_and(|c|!c.is_null()){return Err("FUNCTION_CONST".into());}continue;}
  match s["type"].as_str().ok_or("FUNCTION_SCHEMA")?{
   "string"|"identifier"|"timestamp"=>{let text=v.as_str().ok_or("FUNCTION_TYPE")?;if s["type"]=="identifier"&&text.trim().is_empty(){return Err("FUNCTION_ID".into());}if s["type"]=="timestamp"&&chrono::DateTime::parse_from_rfc3339(text).is_err(){return Err("FUNCTION_TIMESTAMP".into());}if s["max"].as_u64().is_some_and(|n|text.encode_utf16().count()as u64>n){return Err("FUNCTION_LIMIT".into());}if let Some(p)=s["pattern"].as_str(){if !regex::Regex::new(p).map_err(|_|"FUNCTION_PATTERN")?.is_match(text){return Err("FUNCTION_PATTERN".into());}}},
   "integer"=>{let n=v.as_i64().ok_or("FUNCTION_TYPE")?;if n.unsigned_abs()>9007199254740991{return Err("FUNCTION_TYPE".into());}if s["min"].as_i64().is_some_and(|b|n<b)||s["max"].as_i64().is_some_and(|b|n>b){return Err("FUNCTION_RANGE".into());}},
   "boolean"=>{if !v.is_boolean(){return Err("FUNCTION_BOOLEAN".into());}},
   "list"=>{let rows=v.as_array().ok_or("FUNCTION_LIST")?;if s["max"].as_u64().is_some_and(|n|rows.len() as u64>n){return Err("FUNCTION_LIMIT".into());}let item=s["items"].as_str().ok_or("FUNCTION_SCHEMA")?;for row in rows{if item=="string"||item=="identifier"{let text=row.as_str().ok_or("FUNCTION_TYPE")?;if item=="identifier"&&text.trim().is_empty(){return Err("FUNCTION_TYPE".into());}}else{schema(m,item,row,depth+1)?;}}},
   other=>schema(m,other,v,depth+1)?
  }
  if s.get("const").is_some_and(|c|c!=v){return Err("FUNCTION_CONST".into());}
 }Ok(())
}
fn access<'a>(root:&'a Value,selector:&str)->Option<&'a Value>{let mut v=root;for k in selector.split('.') {v=v.get(k)?;}Some(v)}
async fn fetch_binding(b:&Value,roots:&Value,env:&BTreeMap<String,String>)->R{
 let mut url=reqwest::Url::parse(env.get(b["urlEnv"].as_str().ok_or("FUNCTION_ENV_REQUIRED")?).ok_or("FUNCTION_ENV_REQUIRED")?).map_err(|_|"FUNCTION_URL")?;
 if url.scheme()!="https"||!url.username().is_empty()||url.password().is_some(){return Err("FUNCTION_URL".into());}
 for(k,s)in b["query"].as_object().ok_or("FUNCTION_INTEGRATION_QUERY")?{let v=access(roots,s.as_str().ok_or("FUNCTION_INTEGRATION_QUERY")?).ok_or("FUNCTION_INTEGRATION_QUERY")?;let text=if let Some(s)=v.as_str(){s.to_owned()}else if v.is_number(){v.to_string()}else{return Err("FUNCTION_INTEGRATION_QUERY".into());};url.query_pairs_mut().append_pair(k,&text);}
 let client=reqwest::Client::builder().redirect(reqwest::redirect::Policy::none()).timeout(std::time::Duration::from_millis(b["timeout"].as_u64().unwrap())).build().map_err(|_|"FUNCTION_INTEGRATION_FAILED")?;
 let mut request=client.get(url).header("accept","application/json");if let Some(key)=b["secretEnv"].as_str(){request=request.bearer_auth(env.get(key).ok_or("FUNCTION_ENV_REQUIRED")?);}
 let mut response=request.send().await.map_err(|e|if e.is_timeout(){"FUNCTION_INTEGRATION_TIMEOUT"}else{"FUNCTION_INTEGRATION_FAILED"})?;if !response.status().is_success(){return Err("FUNCTION_INTEGRATION_STATUS".into());}
 let mut bytes=Vec::new();while let Some(chunk)=response.chunk().await.map_err(|e|if e.is_timeout(){"FUNCTION_INTEGRATION_TIMEOUT"}else{"FUNCTION_INTEGRATION_FAILED"})?{if bytes.len()+chunk.len()>b["maxBytes"].as_u64().unwrap()as usize{return Err("FUNCTION_INTEGRATION_LIMIT".into());}bytes.extend_from_slice(&chunk);}
 serde_json::from_slice(&bytes).map_err(|_|"FUNCTION_INTEGRATION_FAILED".into())
}
async fn run(ctx:&mut Context,env:&BTreeMap<String,String>,local:bool)->R{
 let m=model();schema(&m,m["endpoint"]["input"].as_str().unwrap(),&ctx.roots["input"],0)?;ctx.precheck()?;
 for step in bindings().as_array().unwrap(){let b=&m["integrations"][step["integration"].as_str().unwrap()];let provided=b["provided"].as_str().and_then(|s|access(&ctx.roots,s)).cloned();let remote=provided.is_none();let data=if let Some(v)=provided{v}else{if local||b["transport"]=="provided"{return Err("FUNCTION_INTEGRATION_REQUIRED".into());}fetch_binding(b,&ctx.roots,env).await?};schema(&m,b["output"].as_str().unwrap(),&data,0).map_err(|e|if remote{"FUNCTION_INTEGRATION_SCHEMA".into()}else{e})?;ctx.roots[step["name"].as_str().unwrap()]=data;}
 let result=ctx.execute()?;schema(&m,m["endpoint"]["output"].as_str().unwrap(),&result,0).map_err(|_|"FUNCTION_OUTPUT_SCHEMA")?;Ok(result)
}
pub async fn invoke(input:Value,env:&BTreeMap<String,String>)->R{run(&mut Context::new(input,false),env,false).await}
pub async fn trace(input:Value,manifest:Value)->Value{
 let input=normalize(input);let input_hash=hash(input.to_string().as_bytes());let mut ctx=Context::new(input,true);let result=run(&mut ctx,&BTreeMap::new(),true).await;let outcome=match result{Ok(v)=>json!({"status":"succeeded","result":v}),Err(code)=>json!({"status":"failed","code":code})};let selected=ctx.events.iter().find(|e|e["kind"]=="selected-case").map(|e|e["index"].clone());
 json!({"schema_version":"alchlang.rust-invocation-trace/v1","binding":{"source_sha256":hash(include_bytes!("../source.alch")),"ontology_sha256":hash(include_bytes!("../ontology.json")),"behavior_sha256":hash(include_bytes!("lib.rs")),"contract_sha256":hash(include_bytes!("../composition.json")),"build_manifest_sha256":hash(manifest.to_string().as_bytes()),"input_sha256":input_hash},"execution_mode":"local-provided-inputs","outcome":outcome,"capture":{"complete":!ctx.truncated,"truncated":ctx.truncated,"recorded_bytes":ctx.bytes},"selected_case":selected,"events":ctx.events,"authority_effect":"none","claim":"native local observation; UInt64 events use exact JSON integers; not a signed attestation"})
}
pub async fn handler(request:axum::extract::Request)->axum::response::Response{
 use axum::response::IntoResponse;let m=model();let ep=&m["endpoint"];let env:BTreeMap<String,String>=std::env::vars().collect();
 fn reply(status:u16,value:Value)->axum::response::Response{(axum::http::StatusCode::from_u16(status).unwrap(),[("cache-control","no-store")],axum::Json(value)).into_response()}
 if request.uri().path()!=ep["path"].as_str().unwrap(){return reply(404,json!({"error":"NOT_FOUND"}));}if request.method()!=axum::http::Method::POST{return reply(405,json!({"error":"METHOD_NOT_ALLOWED"}));}
 let Some(token)=env.get(ep["authEnv"].as_str().unwrap())else{return reply(503,json!({"error":"FUNCTION_ENV_REQUIRED"}));};if token.is_empty(){return reply(503,json!({"error":"FUNCTION_ENV_REQUIRED"}));}
 if request.headers().get("authorization").and_then(|v|v.to_str().ok())!=Some(format!("Bearer {token}").as_str()){return reply(401,json!({"error":"UNAUTHORIZED"}));}
 if request.headers().get("content-type").and_then(|v|v.to_str().ok()).and_then(|v|v.split(';').next()).map(str::trim)!=Some("application/json"){return reply(415,json!({"error":"CONTENT_TYPE"}));}
 let result: R=async{let bytes=tokio::time::timeout(std::time::Duration::from_millis(ep["timeout"].as_u64().unwrap()),axum::body::to_bytes(request.into_body(),ep["maxBytes"].as_u64().unwrap()as usize)).await.map_err(|_|"FUNCTION_TIMEOUT")?.map_err(|_|"FUNCTION_BODY_LIMIT")?;let input=serde_json::from_slice(&bytes).map_err(|_|"INVALID_JSON")?;invoke(input,&env).await}.await;
 match result{Ok(v)=>{let status=v["status"].as_str().and_then(|s|ep["statuses"][s].as_u64()).unwrap_or(200);reply(status as u16,v)},Err(code)=>{let status=if code=="INVALID_JSON"{400}else{ep["errors"][&code].as_u64().unwrap_or(ep["errorStatus"].as_u64().unwrap())};reply(status as u16,json!({"error":code}))}}
}

impl Context {fn n_PriceRow(&mut self,v_row:Value)->R {self.emit(json!({"kind":"node-start","declaration":"PriceRow","node_kind":"Mapping"}));let result=(||->R{let mut fields=serde_json::Map::new();fields.insert("priceId".into(),(v_row.clone())["id"].clone());
fields.insert("currency".into(),(v_row.clone())["currency_code"].clone());
fields.insert("amountMinor".into(),json!(decimal(string(((v_row.clone())["raw_amount"].clone())["value"].clone())?,2)?));
fields.insert("minQuantity".into(),json!(uint64({let v=(v_row.clone())["min_quantity"].clone();if v.is_null(){json!(0)}else{v}})?));
fields.insert("maxQuantity".into(),{let v={let v=(v_row.clone())["max_quantity"].clone();if v.is_null(){Value::Null}else{json!(uint64(v)?)}};if v.is_null(){json!(uint64(json!("18446744073709551615"))?)}else{v}});Ok(Value::Object(fields))})();self.observed("PriceRow","Mapping",&result);result}
fn n_Tiers(&mut self)->R {if let Some(v)=self.memo.get("Tiers"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"Tiers","node_kind":"Query"}));let result=(||->R{let rows=list((self.roots["snapshot"].clone())["prices"].clone())?;self.emit(json!({"kind":"query-start","declaration":"Tiers","total":rows.len()}));let mut selected=Vec::new();for (index,v_row) in rows.into_iter().enumerate(){let accepted=boolean(json!(boolean(json!(!boolean(json!(!((v_row.clone())["deleted_at"].clone()).is_null()))?))? && boolean(json!(((v_row.clone())["currency_code"].clone()) == (json!("usd"))))?))?;self.emit(json!({"kind":"query-row","declaration":"Tiers","index":index,"accepted":accepted,"row":v_row}));if accepted{selected.push(v_row);}}let mut out=Vec::new();for v_row in selected{out.push({let arg0=v_row.clone();self.n_PriceRow(arg0)?});}Ok(Value::Array(out))})();self.observed("Tiers","Query",&result);if let Ok(v)=&result{self.memo.insert("Tiers".into(),v.clone());}result}
fn n_Eligible(&mut self)->R {if let Some(v)=self.memo.get("Eligible"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"Eligible","node_kind":"Query"}));let result=(||->R{let rows=list(self.n_Tiers()?)?;self.emit(json!({"kind":"query-start","declaration":"Eligible","total":rows.len()}));let mut selected=Vec::new();for (index,v_p) in rows.into_iter().enumerate(){let accepted=boolean(json!(boolean(json!(boolean(json!(((v_p.clone())["currency"].clone()) == (json!(string(((self.roots["input"].clone())["request"].clone())["currency_code"].clone())?.to_lowercase()))))? && boolean(json!(compare((v_p.clone())["minQuantity"].clone(),json!(uint64(((self.roots["input"].clone())["request"].clone())["quantity"].clone())?))? <= 0))?))? && boolean(json!(compare((v_p.clone())["maxQuantity"].clone(),json!(uint64(((self.roots["input"].clone())["request"].clone())["quantity"].clone())?))? >= 0))?))?;self.emit(json!({"kind":"query-row","declaration":"Eligible","index":index,"accepted":accepted,"row":v_p}));if accepted{selected.push(v_p);}}let mut out=Vec::new();for v_p in selected{out.push(v_p.clone());}Ok(Value::Array(out))})();self.observed("Eligible","Query",&result);if let Ok(v)=&result{self.memo.insert("Eligible".into(),v.clone());}result}
fn n_Cheapest(&mut self)->R {if let Some(v)=self.memo.get("Cheapest"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"Cheapest","node_kind":"Query"}));let result=(||->R{let rows=list(self.n_Eligible()?)?;self.emit(json!({"kind":"query-start","declaration":"Cheapest","total":rows.len()}));let mut selected=Vec::new();for (index,v_p) in rows.into_iter().enumerate(){let accepted=boolean(json!(!boolean({let rows=list(self.n_Eligible()?)?;let mut answer=false;for v_q in rows {if boolean(json!(compare((v_q.clone())["amountMinor"].clone(),(v_p.clone())["amountMinor"].clone())? < 0))? == true {answer=true;break;}}json!(answer)})?))?;self.emit(json!({"kind":"query-row","declaration":"Cheapest","index":index,"accepted":accepted,"row":v_p}));if accepted{selected.push(v_p);}}let mut out=Vec::new();for v_p in selected{out.push(v_p.clone());}Ok(Value::Array(out))})();self.observed("Cheapest","Query",&result);if let Ok(v)=&result{self.memo.insert("Cheapest".into(),v.clone());}result}
fn n_NoPrice(&mut self)->R {if let Some(v)=self.memo.get("NoPrice"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"NoPrice","node_kind":"Rule"}));let result=(||->R{Ok(json!(!boolean({let rows=list(self.n_Cheapest()?)?;let mut answer=false;for v_p in rows {if boolean(json!(true))? == true {answer=true;break;}}json!(answer)})?))})();self.observed("NoPrice","Rule",&result);if let Ok(v)=&result{self.memo.insert("NoPrice".into(),v.clone());}result}
fn n_UniquePrice(&mut self)->R {if let Some(v)=self.memo.get("UniquePrice"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"UniquePrice","node_kind":"Rule"}));let result=(||->R{Ok({let rows=list(self.n_Cheapest()?)?;let mut count=0;for v_p in rows {if boolean(json!(true))? {count+=1;}}json!(count==1)})})();self.observed("UniquePrice","Rule",&result);if let Ok(v)=&result{self.memo.insert("UniquePrice".into(),v.clone());}result}
fn n_AmbiguousPrice(&mut self)->R {if let Some(v)=self.memo.get("AmbiguousPrice"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"AmbiguousPrice","node_kind":"Rule"}));let result=(||->R{Ok(json!(boolean({let rows=list(self.n_Cheapest()?)?;let mut answer=false;for v_p in rows {if boolean(json!(true))? == true {answer=true;break;}}json!(answer)})? && boolean(json!(!boolean(self.n_UniquePrice()?)?))?))})();self.observed("AmbiguousPrice","Rule",&result);if let Ok(v)=&result{self.memo.insert("AmbiguousPrice".into(),v.clone());}result}
fn n_EmptyQuote(&mut self)->R {if let Some(v)=self.memo.get("EmptyQuote"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"EmptyQuote","node_kind":"Mapping"}));let result=(||->R{let mut fields=serde_json::Map::new();fields.insert("request_id".into(),((self.roots["input"].clone())["request"].clone())["request_id"].clone());
fields.insert("variant_id".into(),((self.roots["input"].clone())["request"].clone())["variant_id"].clone());
fields.insert("price_set_id".into(),(self.roots["snapshot"].clone())["price_set_id"].clone());
fields.insert("currency_code".into(),json!("usd"));
fields.insert("status".into(),json!("no_price"));Ok(Value::Object(fields))})();self.observed("EmptyQuote","Mapping",&result);if let Ok(v)=&result{self.memo.insert("EmptyQuote".into(),v.clone());}result}
fn n_AmbiguousQuote(&mut self)->R {if let Some(v)=self.memo.get("AmbiguousQuote"){return Ok(v.clone());}self.emit(json!({"kind":"node-start","declaration":"AmbiguousQuote","node_kind":"Mapping"}));let result=(||->R{let mut fields=serde_json::Map::new();fields.insert("request_id".into(),((self.roots["input"].clone())["request"].clone())["request_id"].clone());
fields.insert("variant_id".into(),((self.roots["input"].clone())["request"].clone())["variant_id"].clone());
fields.insert("price_set_id".into(),(self.roots["snapshot"].clone())["price_set_id"].clone());
fields.insert("currency_code".into(),json!("usd"));
fields.insert("status".into(),json!("ambiguous_price"));
fields.insert("price_ids".into(),sorted(Value::Array(list(self.n_Cheapest()?)?.into_iter().map(|v|v["priceId"].clone()).collect()))?);
fields.insert("unit_amount".into(),json!(money(uint64(one(distinct(Value::Array(list(self.n_Cheapest()?)?.into_iter().map(|v|v["amountMinor"].clone()).collect()))?)?)?,2)));Ok(Value::Object(fields))})();self.observed("AmbiguousQuote","Mapping",&result);if let Ok(v)=&result{self.memo.insert("AmbiguousQuote".into(),v.clone());}result}
fn n_SelectedQuote(&mut self,v_p:Value)->R {self.emit(json!({"kind":"node-start","declaration":"SelectedQuote","node_kind":"Mapping"}));let result=(||->R{let mut fields=serde_json::Map::new();fields.insert("request_id".into(),((self.roots["input"].clone())["request"].clone())["request_id"].clone());
fields.insert("variant_id".into(),((self.roots["input"].clone())["request"].clone())["variant_id"].clone());
fields.insert("price_set_id".into(),(self.roots["snapshot"].clone())["price_set_id"].clone());
fields.insert("currency_code".into(),json!("usd"));
fields.insert("status".into(),json!("quoted"));
fields.insert("price_id".into(),(v_p.clone())["priceId"].clone());
fields.insert("unit_amount".into(),json!(money(uint64((v_p.clone())["amountMinor"].clone())?,2)));
fields.insert("unit_amount_minor".into(),json!(uint64((v_p.clone())["amountMinor"].clone())?.to_string()));
fields.insert("quantity".into(),((self.roots["input"].clone())["request"].clone())["quantity"].clone());
fields.insert("subtotal".into(),json!(money(uint64({let arg0=(v_p.clone())["amountMinor"].clone();let arg1=json!(uint64(((self.roots["input"].clone())["request"].clone())["quantity"].clone())?);self.c_LineSubtotal(arg0,arg1)?})?,2)));
fields.insert("subtotal_minor".into(),json!(uint64({let arg0=(v_p.clone())["amountMinor"].clone();let arg1=json!(uint64(((self.roots["input"].clone())["request"].clone())["quantity"].clone())?);self.c_LineSubtotal(arg0,arg1)?})?.to_string()));Ok(Value::Object(fields))})();self.observed("SelectedQuote","Mapping",&result);result}
fn c_LineSubtotal(&mut self,a0:Value,a1:Value)->R {self.emit(json!({"kind":"node-start","declaration":"LineSubtotal","node_kind":"Calculation"}));let result=(||->R{let mut inputs=std::collections::BTreeMap::new();inputs.insert("amount_minor".into(),uint64(a0)?);inputs.insert("requested_quantity".into(),uint64(a1)?);core_LineSubtotal::line_subtotal(&inputs).map(|n|json!(n)).map_err(calculation_error)})();self.observed("LineSubtotal","Calculation",&result);result}
fn precheck(&mut self)->Result<(),String>{let passed=boolean(json!((json!(string(((self.roots["input"].clone())["request"].clone())["currency_code"].clone())?.to_lowercase())) == (json!("usd"))))?;self.emit(json!({"kind":"assertion","index":0,"phase":"input","code":"QUOTE_UNSUPPORTED_CURRENCY","passed":passed}));if !passed{return Err("QUOTE_UNSUPPORTED_CURRENCY".into());}



Ok(())}
fn execute(&mut self)->R {let passed=boolean(json!((json!(string(((self.roots["input"].clone())["request"].clone())["currency_code"].clone())?.to_lowercase())) == (json!("usd"))))?;self.emit(json!({"kind":"assertion","index":0,"phase":"behavior","code":"QUOTE_UNSUPPORTED_CURRENCY","passed":passed}));if !passed{return Err("QUOTE_UNSUPPORTED_CURRENCY".into());}
let passed=boolean(json!(((self.roots["snapshot"].clone())["variant_id"].clone()) == (((self.roots["input"].clone())["request"].clone())["variant_id"].clone())))?;self.emit(json!({"kind":"assertion","index":1,"phase":"behavior","code":"QUOTE_VARIANT_MISMATCH","passed":passed}));if !passed{return Err("QUOTE_VARIANT_MISMATCH".into());}
let passed=boolean({let rows=list((self.roots["snapshot"].clone())["prices"].clone())?;let mut answer=true;for v_row in rows {if boolean(json!(((v_row.clone())["price_set_id"].clone()) == ((self.roots["snapshot"].clone())["price_set_id"].clone())))? == false {answer=false;break;}}json!(answer)})?;self.emit(json!({"kind":"assertion","index":2,"phase":"behavior","code":"QUOTE_PRICE_SET_MISMATCH","passed":passed}));if !passed{return Err("QUOTE_PRICE_SET_MISMATCH".into());}
let passed=boolean(json!((json!(list(distinct(Value::Array(list((self.roots["snapshot"].clone())["prices"].clone())?.into_iter().map(|v|v["id"].clone()).collect()))?)?.len())) == (json!(list((self.roots["snapshot"].clone())["prices"].clone())?.len()))))?;self.emit(json!({"kind":"assertion","index":3,"phase":"behavior","code":"QUOTE_DUPLICATE_PRICE","passed":passed}));if !passed{return Err("QUOTE_DUPLICATE_PRICE".into());}
let passed=boolean({let rows=list((self.roots["snapshot"].clone())["prices"].clone())?;let mut answer=true;for v_row in rows {if boolean(json!(compare({let v=(v_row.clone())["min_quantity"].clone();if v.is_null(){json!(0)}else{v}},{let v=(v_row.clone())["max_quantity"].clone();if v.is_null(){json!(2147483647)}else{v}})? <= 0))? == false {answer=false;break;}}json!(answer)})?;self.emit(json!({"kind":"assertion","index":4,"phase":"behavior","code":"QUOTE_TIER_RANGE","passed":passed}));if !passed{return Err("QUOTE_TIER_RANGE".into());}let mut matches=Vec::new();let passed=boolean(self.n_NoPrice()?)?;self.emit(json!({"kind":"result-case","index":0,"passed":passed}));if passed{matches.push(0);}
let passed=boolean(self.n_UniquePrice()?)?;self.emit(json!({"kind":"result-case","index":1,"passed":passed}));if passed{matches.push(1);}
let passed=boolean(self.n_AmbiguousPrice()?)?;self.emit(json!({"kind":"result-case","index":2,"passed":passed}));if passed{matches.push(2);}if matches.len()!=1{return Err("DS_RESULT_CARDINALITY".into());}self.emit(json!({"kind":"selected-case","index":matches[0]}));match matches[0]{0=>Ok(self.n_EmptyQuote()?),
1=>Ok({let arg0=one(self.n_Cheapest()?)?;self.n_SelectedQuote(arg0)?}),
2=>Ok(self.n_AmbiguousQuote()?),_=>unreachable!()}}}
