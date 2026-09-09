//! Cached canonical metadata, preserving the v1 JSON state digest.
use crate::model::Database;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

#[derive(Debug)]
pub struct EncodedRecord {
    pub json: Vec<u8>,
    pub digest: [u8; 32],
    key_json: Vec<u8>,
}
#[derive(Debug)]
pub struct EncodedCollection {
    pub records: BTreeMap<String, EncodedRecord>,
    byte_len: usize,
}
impl EncodedCollection {
    pub fn new<'a, V: Serialize + 'a>(
        records: impl Iterator<Item = (&'a String, &'a V)>,
    ) -> Result<Self, String> {
        let mut result = Self {
            records: BTreeMap::new(),
            byte_len: 2,
        };
        for (key, value) in records {
            // Value sorts nested object fields, as the existing journal format does.
            let json = serde_json::to_vec(&serde_json::to_value(value).map_err(|e| e.to_string())?)
                .map_err(|e| e.to_string())?;
            let key_json = serde_json::to_vec(key).map_err(|e| e.to_string())?;
            result.byte_len +=
                usize::from(!result.records.is_empty()) + key_json.len() + 1 + json.len();
            let digest = Sha256::digest(&json).into();
            result.records.insert(
                key.clone(),
                EncodedRecord {
                    json,
                    digest,
                    key_json,
                },
            );
        }
        Ok(result)
    }
    fn hash_into(&self, hash: &mut Sha256) {
        hash.update(b"{");
        for (index, record) in self.records.values().enumerate() {
            if index > 0 {
                hash.update(b",");
            }
            hash.update(&record.key_json);
            hash.update(b":");
            hash.update(&record.json);
        }
        hash.update(b"}");
    }
}

pub struct Metadata<'a> {
    collections: BTreeMap<&'static str, &'a EncodedCollection>,
    operations: &'a crate::shared_state::SharedSet,
}
impl Database {
    pub fn metadata(&self) -> Result<Metadata<'_>, String> {
        Ok(Metadata {
            collections: [
                ("accounts", self.accounts.encoding()?),
                ("artifacts", self.artifacts.encoding()?),
                ("client_errors", self.client_errors.encoding()?),
                ("files", self.files.encoding()?),
                ("grants", self.grants.encoding()?),
                ("identities", self.identities.encoding()?),
                ("reissues", self.reissues.encoding()?),
            ]
            .into_iter()
            .collect(),
            operations: &self.consumed_operations,
        })
    }
}
impl Metadata<'_> {
    pub fn byte_len(&self) -> usize {
        // Eight named fields: quoted names, colon, seven commas, outer braces.
        2 + 7
            + self
                .collections
                .iter()
                .map(|(name, value)| name.len() + 3 + value.byte_len)
                .sum::<usize>()
            + "consumed_operations".len()
            + 3
            + self.operations.encoding().len()
    }
    pub fn digest(&self) -> [u8; 32] {
        let mut hash = Sha256::new();
        hash.update(b"{");
        let mut names: Vec<_> = self.collections.keys().copied().collect();
        names.push("consumed_operations");
        names.sort_unstable();
        for (index, name) in names.iter().enumerate() {
            if index > 0 {
                hash.update(b",");
            }
            hash.update(b"\"");
            hash.update(name.as_bytes());
            hash.update(b"\":");
            if *name == "consumed_operations" {
                hash.update(self.operations.encoding());
            } else {
                self.collections[name].hash_into(&mut hash);
            }
        }
        hash.update(b"}");
        hash.finalize().into()
    }
    pub fn documents(&self) -> BTreeMap<(String, String), (&[u8], [u8; 32])> {
        let mut documents = BTreeMap::new();
        for (name, collection) in &self.collections {
            for (key, record) in &collection.records {
                documents.insert(
                    ((*name).into(), key.clone()),
                    (record.json.as_slice(), record.digest),
                );
            }
        }
        let digest = Sha256::digest(b"true").into();
        for key in self.operations.iter() {
            documents.insert(
                ("consumed_operations".into(), key.clone()),
                (b"true".as_slice(), digest),
            );
        }
        documents
    }
}
