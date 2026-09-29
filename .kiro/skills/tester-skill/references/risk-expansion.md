# Risk-Based Test Expansion

## When to Expand

Check `risks[]` array in the scenario inventory. For each risk with `score ≥ 6`, generate additional test cases targeting that specific `featureArea`.

## Expansion Matrix

| Risk Score | Level | Extra Boundary TCs | Extra Negative TCs |
|---|---|---|---|
| 6-8 | High | +2 minimum | +2 minimum |
| 9-12 | Critical | +3 minimum | +3 minimum |

## Boundary Patterns

For each field in the risk's feature area, generate TCs using these values:

| Pattern | Value | Expected |
|---|---|---|
| At minimum valid | 1 character (e.g., "A") | Accepted |
| At maximum valid | Exact limit from Fields table (e.g., 40 chars) | Accepted |
| One below minimum | Empty string or 0 | Rejected with error |
| One above maximum | Limit + 1 (e.g., 41 chars) | Rejected with error |
| Max length + special chars | Limit-length string with `<>&"'/` mixed in | Accepted (chars allowed) or Rejected (if sanitized) |
| Unicode boundary | Max-length string with unicode: `café résumé 日本語` | Accepted or specific error |

**ONLY use limits from the Fields & Validation table.** If no limit is stated, test with extreme values (1000+ chars) WITHOUT claiming what the limit is.

## Negative Patterns

| Pattern | Value | Expected |
|---|---|---|
| Required field empty | Leave field completely empty | Specific error message for that field |
| Invalid format | Wrong type (e.g., "abc" in number field, "notanemail" in email) | Format-specific error |
| Special characters | `<script>alert(1)</script>` or `'; DROP TABLE;--` | Sanitized/rejected |
| Extremely long input | 1000+ characters | Error or truncation |
| Whitespace only | `"   "` (spaces/tabs only) | Treated as empty OR specific error |
| Leading/trailing spaces | `"  value  "` | Trimmed on save OR preserved (test both) |

## Linking Expansion TCs to Source

Each expansion TC MUST have:
- `sourceScenarioId` → the scenario ID from the risk's feature area
- `priority` → inherited from the risk severity (Critical risk → Critical TC)
- Title prefix → include the risk context: "Verify {field} rejects {boundary condition}"

## Example

If `risks[]` has:
```json
{ "id": "RISK-001", "featureArea": "Score calculation", "score": 9, "evidence": "External Bedrock API + complex parsing" }
```

Generate 3 boundary + 3 negative TCs specifically for score-related fields:
- TC: Verify score endpoint rejects sessionId with 256+ chars (boundary)
- TC: Verify score endpoint handles empty request body (negative)
- TC: Verify score endpoint rejects non-UUID sessionId format (negative)
- etc.
