# Relationships

| From | Relationship | To | Allowed? |
|---|---|---|---|
| System-owned corpus | supplies descriptor/observation/hostiles | Realization composition adapter | Yes |
| Composition adapter | imports one generic evaluator | Family semantics | Yes |
| Composition adapter | imports one language-native target | Target | Yes |
| Provider | executes | Composition adapter | Yes |
| Target | type-only shape dependency | Generic contract | Yes |
| Target | runtime import | Family evaluator/decoder | No |
| Target | runtime import | System fixture or realization fixture | No |
| Target | embeds | System expected outcomes/hostiles/case construction | No under the recommended architecture |
