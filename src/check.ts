import { Module, Statement, Type, Node, Expression, Identifier, TypeAlias, Interface } from './types'
import { error } from './error'
import { resolve } from './bind'
const stringType: Type = { id: "string" }
const numberType: Type = { id: "number" }
const errorType: Type = { id: "error" }
function typeToString(type: Type): string {
    if (type.members) {
        return `{ ${[...type.members].map(([k, t]) => `${k}: ${typeToString(t)}`).join(", ")} }`
    }
    return type.id
}
function isTypeEqual(a: Type, b: Type): boolean {
    if (a === b) return true
    if (a === errorType || b === errorType) return true
    if (!a.members || !b.members) return false
    if (a.members.size !== b.members.size) return false
    for (const [name, aMember] of a.members) {
        const bMember = b.members.get(name)
        if (!bMember) return false
        if (!isTypeEqual(aMember, bMember)) return false
    }
    return true
}
export function check(module: Module) {
    return module.statements.map(checkStatement)

    function checkStatement(statement: Statement): Type {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return checkExpression(statement.expr)
            case Node.Var:
            case Node.Let: {
                const i = checkExpression(statement.init)
                if (!statement.typename) {
                    return i
                }
                const t = checkType(statement.typename)
                if (!isTypeEqual(t, i))
                    error(statement.init.pos, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
            }
            case Node.TypeAlias:
                return checkType(statement.typename)
            case Node.Interface:
                return checkType(statement.name)
        }
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case Node.Identifier: {
                const symbol = resolve(module.locals, expression.text, 'value')
                if (symbol) {
                    if (symbol.valueDeclaration!.kind === Node.Let
                        && expression.pos < symbol.valueDeclaration!.pos) {
                        error(expression.pos, `Block-scoped variable '${expression.text}' used before its declaration.`)
                    }
                    return checkStatement(symbol.valueDeclaration!)
                }
                error(expression.pos, "Could not resolve " + expression.text)
                return errorType
            }
            case Node.Literal:
                return numberType
            case Node.StringLiteral:
                return stringType
            case Node.ObjectLiteral:
                const members = new Map<string, Type>()
                for (const p of expression.properties) {
                    members.set(p.name.text, checkExpression(p.initializer))
                }
                return { id: "object", members }
            case Node.Assignment:
                const v = checkExpression(expression.value)
                const t = checkExpression(expression.name)
                if (!isTypeEqual(t, v))
                    error(expression.value.pos, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
                return t
        }
    }
    function checkType(name: Identifier): Type {
        switch (name.text) {
            case "string":
                return stringType
            case "number":
                return numberType
            default:
                const symbol = resolve(module.locals, name.text, 'type')
                if (!symbol) {
                    error(name.pos, "Could not resolve type " + name.text)
                    return errorType
                }
                const interfaces = symbol.declarations.filter(d => d.kind === Node.Interface) as Interface[]
                if (interfaces.length) {
                    const members = new Map<string, Type>()
                    for (const i of interfaces) {
                        for (const m of i.members) {
                            members.set(m.name.text, checkType(m.typename))
                        }
                    }
                    return { id: name.text, members }
                }
                return checkType((symbol.declarations.find(d => d.kind === Node.TypeAlias) as TypeAlias).typename)
        }
    }
}
