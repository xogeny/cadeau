# Presentation metadata

## `title`

Values: string
Default: ''

This will be used, for example, in the
`<head><title>...</title></head>` element but might also be used for
other things like Facebook's OpenGraph or Twitter card metadata.

## `desc`

Values: string
Default: None

This will be used, for example, in a `<meta
name="description">...</meta>` element but might also be used for
other things like Facebook's OpenGraph or Twitter card metadata.

## `favicon`

Values: url
Default: None

This will be used to associate a favicon with the presentation

## `authors`

Values: array
Default: []

TBD (should this be an array of objects or just use some kind of canonical string
format like "Michael M. Tiller <michael.tiller@gmail.com>"???

## `url`

Values: url
Default: None

Used to populate metadata like Facebook's OpenGraph and Twitter cards.

## `image`

Values: url
Default: None

Used to populate metadata like Facebook's OpenGraph and Twitter cards.

## `math`

Values: `true` | `false`
Default: `true`

If `true`, MathJax is included in generated HTML.

## `engine`

Values: `flowtime`
Default: `flowtime`

Determines which rendering engine is used.

## `draft`

Values: `true` | `false`
Default: `false`

Used to toggle additional information useful during the editing of the presentation.

## `static_path`

Values: a directory name
Default: `static`

Indicates where static resources associated with the presentation are
stored.  These files will be copied into the output directory.

## `styles`

Values: A list of style files
Default: []

These files will be copied, just like the contents of `static_path`
but they will **also** be added as CSS files in any generated HTML.

## `scripts`

Values: A list of script files
Default: []

These files will be copied, just like the contents of `static_path`
but they will **also** be added as Javascript files in any generated
HTML.

## `clicker`

Values: true | false
Default: true

Indicates whether the presentation should be compatible with "presenter"
devices like the Logitech R400.

## `animation`

Values: true | false
Default: true

Can be used to suppress animation (*e.g.,* during content review).

## `includes`

Values: array of filenames
Default: []

A list of files to be included when processing all html files.  To
include a file for only certain slides, use the slide-level `include`
metadata.

## `package`

Values: Object
Default: null

If not `null`, a Node.js `package.json` file will be generated and
this data will be included in it.  This is useful, for example, in
generating presentations that run seamlessly under node-webkit.

# Section metadata

# Slide metadata
