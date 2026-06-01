import { Meaning, Module, Node, Statement, Table } from './types'
import { error } from './error'
export function bind(m: Module) {
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }

    function bindStatement(locals: Table, statement: Statement) {
        if (statement.kind === Node.Var
            || statement.kind === Node.Let
            || statement.kind === Node.TypeAlias
            || statement.kind === Node.Interface) {
            const symbol = locals.get(statement.name.text)
            if (symbol) {
                // 同じ名前空間にある既存宣言（衝突候補）
                const other = symbol.declarations.find(d => isValue(d.kind) === isValue(statement.kind))
                // interface 同士は衝突ではなくマージ
                const isInterfaceMerge = other?.kind === Node.Interface && statement.kind === Node.Interface
                if (other && !isInterfaceMerge) {
                    error(statement.pos, `Cannot redeclare ${statement.name.text}; first declared at ${other.pos}`)
                }
                else {
                    symbol.declarations.push(statement)
                    if (isValue(statement.kind)) {
                        symbol.valueDeclaration = statement
                    }
                }
            }
            else {
                locals.set(statement.name.text, {
                    declarations: [statement],
                    valueDeclaration: isValue(statement.kind) ? statement : undefined
                })
            }
        }
    }
}
export function resolve(locals: Table, name: string, meaning: Meaning) {
    const symbol = locals.get(name)
    if (!symbol) return undefined
    if (meaning === 'type') {
        return symbol.declarations.some(d => d.kind === Node.TypeAlias || d.kind === Node.Interface) ? symbol : undefined
    }
    return symbol.declarations.some(d => isValue(d.kind)) ? symbol : undefined
}
const isValue = (k: Node) => k === Node.Var || k === Node.Let
