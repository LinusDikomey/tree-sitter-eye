module.exports = grammar({
  name: "eye",

  extras: ($) => [$.comment, " ", "\t", "\r"],
  rules: {
    source_file: ($) =>
      seq(repeat(seq(repeat($._newline), $.definition)), repeat($._newline)),
    comment: (_) => token(seq("#", /.*/)),
    _newline: ($) => "\n",
    identifier: ($) => /[_a-zA-Z][_a-zA-Z0-9]*/,
    path: ($) => $.identifier, // TODO
    _type: ($) =>
      choice(
        $.primitive,
        $.array_type,
        $.pointer_type,
        $.tuple_type,
        seq($.path, optional($.generics_instance)),
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
    _expr: ($) =>
      choice(
        seq("(", repeat($._newline), $._expr, repeat($._newline), ")"),
        $.identifier,
        $.block,
        $.decl,
        $.struct_item,
        $.function_item,
        $.int_literal,
        $.tuple_expression,
        $.return_expression,
        $.unit_expression,
        $.unary_expression,
        $.binary_expression,
        $.member_access,
      ),
    block: ($) =>
      seq(
        "{",
        repeat(seq(repeat($._newline), $._expr)),
        repeat($._newline),
        "}",
      ),
    struct_item: ($) =>
      seq(
        "struct",
        optional($.generics),
        repeat($._newline),
        "{",
        delimited($, ",", choice($.definition, $.struct_field)),
        "}",
      ),
    struct_field: ($) => seq($.identifier, $._type),
    function_item: ($) =>
      seq(
        "fn",
        optional($.parameters),
        optional(seq("->", field("return_type", $._type))),
        choice($.block, seq(":", $._expr)),
      ),
    parameters: ($) => seq("(", delimited($, ",", $.parameter), ")"),
    parameter: ($) => seq($.identifier, $._type),
    int_literal: (_) => /[0-9]+/,
    decl: ($) =>
      seq($.identifier, choice(":=", seq(":", $._type, "=")), $._expr),
    unit_expression: (_) => "()",
    return_expression: ($) => prec.right(5, seq("ret", optional($._expr))),
    call_expression: ($) =>
      seq(
        $._expr,
        "(",
        repeat($._newline),
        optional(
          seq(
            $._expr,
            repeat(
              seq(
                choice(
                  seq(
                    seq(repeat($._newline), ",", repeat($._newline)),
                    repeat1($._newline),
                  ),
                ),
                $._expr,
              ),
            ),
            optional(seq($._newline, ",")),
            repeat($._newline),
          ),
        ),
        repeat($._newline),
        optional(seq(",", repeat($._newline))),
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
        //repeat($._newline),
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
      ),
    cast: ($) =>
      seq($._expr, repeat($._newline), "as", repeat($._newline), $._type),
    member_access: ($) =>
      prec.left(500, seq($._expr, /*repeat($._newline),*/ ".", $.identifier)),
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
        optional(delim),
      ),
    ),
  );
}
