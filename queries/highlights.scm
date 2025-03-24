(comment) @comment

; Constants
(definition
  name: (identifier) @constant
  value: _
)

; Variables
; (identifier) @variable
(ignore) @comment.unused

(field_identifier) @property

(call_expression called: (identifier) @function)
(call_expression called: (member_access value: _ field: (field_identifier) @function))
(definition
    name: (identifier) @function
    value: (function_item)
)
(definition
    name: (identifier) @type
    value: (struct_item)
)
(definition
    name: (identifier) @type
    value: (trait_item)
)


(enum_variant variant: _ @constructor)

;(member_access
;    field: _ @property
;)

(primitive) @type
(type_identifier) @type
(type_path (identifier) @type .)
(int_literal) @number
(float_literal) @number
(string_literal) @string

(primitive) @keyword
; Keywords
[
    "fn"
    "ret"
    "true"
    "false"
    "and"
    "or"
    "as"
    "struct"
    "enum"
    "trait"
    ;"impl"
    "if"
    "else"
    "match"
    "while"
    ;"for"
    "extern"
    "root"
    "use"
    ; "asm"
] @keyword

; Operators
(unary_expression "!" @operator)
(unary_expression "-" @operator)
(binary_expression operator: _ @operator)

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket
[
  "."
  ","
  ":"
  "="
  "->"
  ".."
  "..<"
  "-"
] @punctuation.delimiter
