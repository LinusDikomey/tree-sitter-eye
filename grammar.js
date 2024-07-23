module.exports = grammar({
  name: "eye",

  extras: ($) => [$.comment, " ", "\t", "\r"],
  conflicts: ($) => [[$.definition, $._expr]],
  rules: {
    source_file: ($) =>
      seq(repeat(seq(repeat($._newline), $._item)), repeat($._newline)),
    _item: ($) => choice($.definition, $.use),
    comment: (_) => token(seq("#", /.*/)),
    _newline: ($) => "\n",
    identifier: ($) => /[_a-zA-Z][_a-zA-Z0-9]*/,
    field_identifier: ($) => $.identifier,
    type_identifier: ($) => $.identifier,
    path: ($) =>
      prec.left(
        seq(
          choice("root", $.identifier),
          repeat(
            seq(
              repeat($._newline),
              ".",
              repeat($._newline),
              $.field_identifier,
            ),
          ),
        ),
      ),
    type_path: ($) =>
      prec.left(
        seq(
          choice("root", $.identifier),
          repeat(
            seq(repeat($._newline), ".", repeat($._newline), $.type_identifier),
          ),
        ),
      ),
    _type: ($) =>
      choice(
        $.primitive,
        $.array_type,
        $.pointer_type,
        $.tuple_type,
        seq($.type_path, optional($.generics_instance)),
      ),
    primitive: (_) =>
      choice(
        "()",
        "!",
        "bool",
        "u8",
        "i8",
        "u16",
        "i16",
        "u32",
        "i32",
        "u64",
        "i64",
        "u128",
        "i128",
        "f64",
        "f64",
        "type",
      ),
    array_type: ($) =>
      seq(
        "[",
        repeat($._newline),
        $._type,
        repeat($._newline),
        ";",
        repeat($._newline),
        $._expr,
        repeat($._newline),
        "]",
      ),
    pointer_type: ($) => seq("*", repeat($._newline), $._type),
    tuple_type: ($) =>
      seq(
        "(",
        repeat($._newline),
        $._type,
        choice(
          seq(repeat($._newline), ","),
          seq(
            repeat(
              seq(
                choice(
                  seq(repeat($._newline), ",", repeat($._newline)),
                  repeat1($._newline),
                ),
                $._type,
              ),
            ),
            repeat($._newline),
            optional(","),
          ),
        ),
        //repeat($._newline),
        ")",
      ),
    use: ($) => seq("use", repeat($._newline), $.path),
    definition: ($) =>
      seq(
        field("name", $.identifier),
        choice(seq(":", repeat($._newline), field("type", $._type), ":"), "::"),
        repeat($._newline),
        field("value", $._expr),
      ),
    generics: ($) =>
      seq(
        "[",
        delimited(
          $,
          ",",
          seq(
            $.path,
            optional(seq(":", $.trait_bound, repeat(seq("+", $.trait_bound)))),
          ),
        ),
        "]",
      ),
    trait_bound: ($) => seq($.path, optional($.generics_instance)),
    generics_instance: ($) => seq("[", delimited($, ",", $._type), "]"),
    _statement: ($) => choice($.decl, $._expr),
    _expr: ($) =>
      choice(
        $.parenthesized_expression,
        $.root,
        $.ignore,
        $.bool_literal,
        $.identifier,
        $.primitive,
        $.block,
        $.function_item,
        $.struct_item,
        $.enum_item,
        $.trait_item,
        $.int_literal,
        $.float_literal,
        $.string_literal,
        $.tuple_expression,
        $.return_expression,
        $.call_expression,
        $.member_access,
        $.unary_expression,
        $.binary_expression,
        $.while_expression,
        $.if_expression,
        $.match_expression,
      ),
    parenthesized_expression: ($) =>
      seq("(", repeat($._newline), $._expr, repeat($._newline), ")"),
    root: (_) => "root",
    ignore: (_) => "_",
    bool_literal: (_) => choice("true", "false"),
    block: ($) =>
      seq("{", delimited($, ",", choice($._statement, $._item)), "}"),
    struct_item: ($) =>
      seq(
        "struct",
        optional($.generics),
        repeat($._newline),
        "{",
        delimited($, ",", choice($.definition, $.struct_field)),
        "}",
      ),
    enum_item: ($) =>
      seq(
        "enum",
        optional($.generics),
        repeat($._newline),
        "{",
        // TODO
        //delimited($, ",", choice($.definition, $.struct_field)),
        "}",
      ),
    trait_item: ($) =>
      seq(
        "trait",
        optional($.generics),
        repeat($._newline),
        "{",
        // TODO
        //delimited($, ",", choice($.definition, $.struct_field)),
        "}",
      ),
    struct_field: ($) => seq($.identifier, $._type),
    function_item: ($) =>
      seq(
        "fn",
        optional($.parameters),
        optional(seq("->", field("return_type", $._type))),
        choice($._block_or_colon_expr, "extern"),
      ),
    _block_or_colon_expr: ($) =>
      choice($.block, seq(":", repeat($._newline), $._expr)),
    parameters: ($) => seq("(", delimited($, ",", $.parameter), ")"),
    parameter: ($) => seq(field("name", $.identifier), field("type", $._type)),
    int_literal: (_) => /[0-9]+/,
    float_literal: (_) => token(/[0-9]*\.[0-9]+/),
    string_literal: (_) => token(/\"(\\.|[^"\\])*\"/),
    decl: ($) =>
      choice(
        $._decl_untyped,
        seq(
          field("pattern", $._expr),
          ":",
          field("type", $._type),
          "=",
          repeat($._newline),
          field("value", $._expr),
        ),
      ),
    _decl_untyped: ($) =>
      seq(
        field("pattern", $._expr),
        ":=",
        repeat($._newline),
        field("value", $._expr),
      ),
    return_expression: ($) => prec.right(5, seq("ret", optional($._expr))),
    call_expression: ($) =>
      prec(300, seq(field("called", $._expr), $.arguments)),
    arguments: ($) =>
      seq(
        "(",
        optional(
          seq(
            repeat($._newline),
            $._expr,
            repeat(
              seq(
                choice(
                  seq(repeat($._newline), ",", repeat($._newline)),
                  repeat1($._newline),
                ),
                $._expr,
              ),
            ),
            optional(seq(repeat($._newline), ",")),
            repeat($._newline),
          ),
        ),
        ")",
      ),
    tuple_expression: ($) =>
      seq(
        "(",
        repeat($._newline),
        $._expr,
        choice(
          seq(
            repeat($._newline),
            ",",
            repeat($._newline),
            optional($._tuple_rest),
          ),
          seq(repeat1($._newline), $._tuple_rest),
        ),
        ")",
      ),
    _tuple_rest: ($) =>
      seq(
        $._expr,
        repeat(
          seq(
            choice(
              seq(repeat($._newline), ",", repeat($._newline)),
              repeat1($._newline),
            ),
            $._expr,
          ),
        ),
        optional(seq(repeat($._newline), ",")),
        repeat($._newline),
      ),
    cast: ($) =>
      seq($._expr, repeat($._newline), "as", repeat($._newline), $._type),
    member_access: ($) =>
      prec.left(
        500,
        seq(
          field("value", $._expr),
          // TODO: this doesn't work for some reason
          //repeat($._newline),
          ".",
          field("field", choice($.field_identifier, $.int_literal)),
        ),
      ),
    unary_expression: ($) => {
      const ops = ["-", "!", "&"];
      return prec(200, choice(seq(choice(...ops), $._expr)));
    },
    binary_expression: ($) => {
      const table = [
        [10, "="],
        [20, choice("..", "..<")],
        [30, "or"],
        [40, "and"],
        [50, choice("==", "!=")],
        [60, choice("<", ">", "<=", ">=")],
        [70, choice("+", "-")],
        [80, choice("*", "/", "%")],
      ];

      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._expr),
              //repeat($._newline),
              field("operator", operator),
              //repeat($._newline),
              field("right", $._expr),
            ),
          ),
        ),
      );
    },
    _cond: ($) => choice($._expr, $._decl_untyped),
    while_expression: ($) =>
      seq(
        "while",
        repeat($._newline),
        field("condition", $._cond),
        repeat($._newline),
        field("body", $._block_or_colon_expr),
      ),
    if_expression: ($) =>
      prec.left(
        0,
        seq(
          "if",
          repeat($._newline),
          field("condition", $._cond),
          repeat($._newline),
          field("then", $._block_or_colon_expr),
          optional(
            seq(repeat($._newline), seq("else", field("else", $._expr))),
          ),
        ),
      ),
    match_expression: ($) =>
      seq(
        "match",
        repeat($._newline),
        field("value", $._expr),
        repeat($._newline),
        "{",
        delimited($, ",", $.match_arm),
        "}",
      ),
    match_arm: ($) =>
      seq(field("pattern", $._expr), field("value", $._block_or_colon_expr)),
  },
});

function delimited($, delim, value) {
  return seq(
    repeat($._newline),
    optional(
      seq(
        value,
        repeat(
          seq(
            choice(
              seq(repeat($._newline), delim, repeat($._newline)),
              repeat1($._newline),
            ),
            value,
          ),
        ),
        repeat($._newline),
        optional(seq(delim, repeat($._newline))),
      ),
    ),
  );
}
