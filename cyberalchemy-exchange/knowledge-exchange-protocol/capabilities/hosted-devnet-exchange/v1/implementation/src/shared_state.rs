//! Copy-on-write state: snapshots share indexes and records, while mutation
//! detaches an index and only the selected record. No interior mutation escapes.
use serde::{ser::SerializeMap, Deserialize, Deserializer, Serialize, Serializer};
use std::{
    borrow::Borrow,
    collections::{btree_map, BTreeMap, BTreeSet},
    ops::{Deref, DerefMut, Index},
    sync::{Arc, OnceLock},
};

#[derive(Debug)]
pub struct SharedMap<V>(
    Arc<BTreeMap<String, Arc<V>>>,
    Arc<OnceLock<Result<crate::metadata::EncodedCollection, String>>>,
);
impl<V> Clone for SharedMap<V> {
    fn clone(&self) -> Self {
        Self(self.0.clone(), self.1.clone())
    }
}
impl<V> Default for SharedMap<V> {
    fn default() -> Self {
        Self(Arc::new(BTreeMap::new()), Arc::new(OnceLock::new()))
    }
}
impl<V> SharedMap<V> {
    pub fn shares_index(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.0, &other.0)
    }
    fn invalidate_encoding(&mut self) {
        self.1 = Arc::new(OnceLock::new());
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
    pub fn get<Q: Ord + ?Sized>(&self, key: &Q) -> Option<&V>
    where
        String: Borrow<Q>,
    {
        self.0.get(key).map(Arc::as_ref)
    }
    pub fn contains_key<Q: Ord + ?Sized>(&self, key: &Q) -> bool
    where
        String: Borrow<Q>,
    {
        self.0.contains_key(key)
    }
    pub fn iter(&self) -> Iter<'_, V> {
        Iter(self.0.iter())
    }
    pub fn values(&self) -> impl Iterator<Item = &V> {
        self.iter().map(|(_, value)| value)
    }
    pub fn insert(&mut self, key: String, value: V) -> Option<Arc<V>> {
        self.invalidate_encoding();
        Arc::make_mut(&mut self.0).insert(key, Arc::new(value))
    }
    pub fn remove<Q: Ord + ?Sized>(&mut self, key: &Q) -> Option<Arc<V>>
    where
        String: Borrow<Q>,
    {
        if !self.0.contains_key(key) {
            return None;
        }
        self.invalidate_encoding();
        Arc::make_mut(&mut self.0).remove(key)
    }
}
impl<V: Clone> SharedMap<V> {
    pub fn get_mut<Q: Ord + ?Sized>(&mut self, key: &Q) -> Option<&mut V>
    where
        String: Borrow<Q>,
    {
        if !self.0.contains_key(key) {
            return None;
        }
        self.invalidate_encoding();
        Arc::make_mut(&mut self.0).get_mut(key).map(Arc::make_mut)
    }
}
impl<V, Q: Ord + ?Sized> Index<&Q> for SharedMap<V>
where
    String: Borrow<Q>,
{
    type Output = V;
    fn index(&self, key: &Q) -> &V {
        self.get(key).expect("state record missing")
    }
}
pub struct Iter<'a, V>(btree_map::Iter<'a, String, Arc<V>>);
impl<'a, V> Iterator for Iter<'a, V> {
    type Item = (&'a String, &'a V);
    fn next(&mut self) -> Option<Self::Item> {
        self.0.next().map(|(key, value)| (key, value.as_ref()))
    }
    fn size_hint(&self) -> (usize, Option<usize>) {
        self.0.size_hint()
    }
}
impl<V> ExactSizeIterator for Iter<'_, V> {}
impl<'a, V> IntoIterator for &'a SharedMap<V> {
    type Item = (&'a String, &'a V);
    type IntoIter = Iter<'a, V>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
impl<V> FromIterator<(String, V)> for SharedMap<V> {
    fn from_iter<T: IntoIterator<Item = (String, V)>>(values: T) -> Self {
        Self(
            Arc::new(
                values
                    .into_iter()
                    .map(|(key, value)| (key, Arc::new(value)))
                    .collect(),
            ),
            Arc::new(OnceLock::new()),
        )
    }
}
impl<V: Serialize> SharedMap<V> {
    pub fn encoding(&self) -> Result<&crate::metadata::EncodedCollection, String> {
        self.1
            .get_or_init(|| crate::metadata::EncodedCollection::new(self.iter()))
            .as_ref()
            .map_err(Clone::clone)
    }
}
impl<V: Serialize> Serialize for SharedMap<V> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(self.len()))?;
        for (key, value) in self {
            map.serialize_entry(key, value)?;
        }
        map.end()
    }
}
impl<'de, V: Deserialize<'de>> Deserialize<'de> for SharedMap<V> {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        Ok(BTreeMap::<String, V>::deserialize(deserializer)?
            .into_iter()
            .collect())
    }
}

#[derive(Clone, Debug, Default)]
pub struct SharedSet(Arc<BTreeSet<String>>, Arc<OnceLock<Vec<u8>>>);
impl SharedSet {
    pub fn encoding(&self) -> &[u8] {
        self.1
            .get_or_init(|| serde_json::to_vec(self.0.as_ref()).expect("strings serialize"))
    }
}
impl Deref for SharedSet {
    type Target = BTreeSet<String>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl DerefMut for SharedSet {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.1 = Arc::new(OnceLock::new());
        Arc::make_mut(&mut self.0)
    }
}
impl Serialize for SharedSet {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.0.as_ref().serialize(serializer)
    }
}
impl<'de> Deserialize<'de> for SharedSet {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        BTreeSet::<String>::deserialize(deserializer)
            .map(|values| Self(Arc::new(values), Arc::new(OnceLock::new())))
    }
}
