# Upload de Fotos S3 - Mobile 

## Configuração AWS

| Chave | Valor |
|-------|-------|
| **Região** | `sa-east-1` |
| **Bucket** | `verificadorindependente-uploads-prod` |
| **Access Key ID** | (pedir para Leonardo) |
| **Secret Access Key** | (pedir para Leonardo) |

---

## Estrutura do Path

```
ocorrencias/{uuid-da-ocorrencia}/photo_{index}.jpg
```

Exemplo: `ocorrencias/a1b2c3d4-e5f6-7890/photo_0.jpg`

---

## Dependência (build.gradle)

```kotlin
dependencies {
    implementation("aws.sdk.kotlin:s3:1.0.0")
    implementation("aws.sdk.kotlin:aws-core:1.0.0")
}
```

## Notas Importantes

- Gerar UUID único para cada ocorrência
- Salvar o `key` retornado (não a URL) no banco de dados
- O bucket é privado - para visualizar, usar signed URL depois
- Implementar retry para uploads que falharam

