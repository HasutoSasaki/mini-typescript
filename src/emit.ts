import { RuntimeStatement, Node, Expression } from './types'
export function emit(statements: RuntimeStatement[]) {
    return statements.map(emitStatement).join(";\n")
}
function emitStatement(statement: RuntimeStatement): string {
    switch (statement.kind) {
        case Node.ExpressionStatement:
            return emitExpression(statement.expr)
        case Node.Var: {
            const typestring = statement.typename ? ": " + statement.name : ""
            return `var ${statement.name.text}${typestring} = ${emitExpression(statement.init)}`
        }
    }
}
function emitExpression(expression: Expression): string {
    switch (expression.kind) {
        case Node.Identifier:
            return expression.text
        case Node.Literal:
            return "" + expression.value
        case Node.StringLiteral:
            return `"${expression.value}"`
        case Node.ObjectLiteral:
            if (expression.properties.length === 0) return "{}"
            return `{ ${expression.properties.map(p => `${p.name.text}: ${emitExpression(p.initializer)}`).join(", ")} }`
        case Node.Assignment:
            return `${expression.name.text} = ${emitExpression(expression.value)}`
    }
}
