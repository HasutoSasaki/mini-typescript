export enum Token {
    Function,
    Var,
    Let,
    Type,
    Interface,
    Return,
    Equals,
    Literal,
    Identifier,
    Newline,
    Semicolon,
    Colon,
    OpenBrace,
    CloseBrace,
    Whitespace,
    Unknown,
    BOF,
    EOF,
}
export type Lexer = {
    scan(): void
    token(): Token
    pos(): number
    text(): string
}
export enum Node {
    Identifier,
    Literal,
    Assignment,
    ExpressionStatement,
    Var,
    Let,
    TypeAlias,
    Interface,
    PropertySignature,
}
export type Error = {
    pos: number
    message: string
}
export interface Location {
    pos: number
}
export type Expression = Identifier | Literal | Assignment
export type Identifier = Location & {
    kind: Node.Identifier
    text: string
}
export type Literal = Location & {
    kind: Node.Literal
    value: number
}
export type Assignment = Location & {
    kind: Node.Assignment
    name: Identifier
    value: Expression
}
export type Statement = ExpressionStatement | Var | Let | TypeAlias | Interface
/** transform 後に実行時へ残る文。let は var に正規化され、type/interface は消える */
export type RuntimeStatement = ExpressionStatement | Var
export type ExpressionStatement = Location & {
    kind: Node.ExpressionStatement
    expr: Expression
}
export type Var = Location & {
    kind: Node.Var
    name: Identifier
    typename?: Identifier | undefined
    init: Expression
}
export type Let = Location & {
    kind: Node.Let
    name: Identifier
    typename?: Identifier | undefined
    init: Expression
}
export type TypeAlias = Location & {
    kind: Node.TypeAlias
    name: Identifier
    typename: Identifier
}
export type Interface = Location & {
    kind: Node.Interface
    name: Identifier
    members: PropertySignature[]
}
export type PropertySignature = Location & {
    kind: Node.PropertySignature
    name: Identifier
    typename: Identifier
}
export type Declaration = Var | Let | TypeAlias | Interface // plus others, like function
export type Meaning = 'value' | 'type'
export type Symbol = {
    valueDeclaration: Declaration | undefined
    declarations: (Declaration | PropertySignature)[]
}
export type Table = Map<string, Symbol>
export type Module = {
    locals: Table
    statements: Statement[]
}
export type Type = { id: string, members?: Table }
