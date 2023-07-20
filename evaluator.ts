type State = "Pass" | "Fail" | "Not Tested";

type Operator = "||" | "&&";

function compareStates(state1: State, state2: State, operator: Operator): State {
    //console.log("comparing states", { state1, state2, operator });
    if (state1 === state2) return state1;

    if (operator === '||') {
        if ((state1 === 'Fail' && state2 === 'Not Tested') || (state1 === 'Not Tested' && state2 === 'Fail')) return 'Fail';
        if ((state1 === 'Fail' && state2 === 'Pass') || (state1 === 'Pass' && state2 === 'Fail')) return 'Pass';
        if ((state1 === 'Pass' && state2 === 'Not Tested') || (state1 === 'Not Tested' && state2 === 'Pass')) return 'Pass';
    } else if (operator === '&&') {
        if ((state1 === 'Fail' && state2 === 'Not Tested') || (state1 === 'Not Tested' && state2 === 'Fail')) return 'Not Tested';
        if ((state1 === 'Fail' && state2 === 'Pass') || (state2 === 'Pass' && state1 === 'Fail')) return 'Fail';
        if ((state1 === 'Not Tested' && state2 === 'Pass') || (state1 === 'Pass' && state2 === 'Not Tested')) return 'Not Tested';
    }
    throw new Error(`Invalid operator: ${operator}`);
}

function evaluateSpecialBoolean(expression: string): State {
    const operatorPrecedence: Record<Operator, number> = {
        '||': 1,
        '&&': 2,
    };

    function evaluateOperator(operator: Operator, leftValue: State, rightValue: State): State {
        if (operator === '||') {
            if (leftValue === 'Pass' || rightValue === 'Pass') return 'Pass';
            const stateCompare = compareStates(leftValue, rightValue, operator);
            // console.log(`states compared: ${stateCompare}`);
            return stateCompare;
        } else if (operator === '&&') {
            const stateCompare =  compareStates(leftValue, rightValue, operator);
            // console.log(`states compared: ${stateCompare}`);
            return stateCompare;
        }

        throw new Error(`Invalid operator: ${operator}`);
    }

    function tokenize(expression: string): string[] {
        const tokens: string[] = [];
        let currentToken = "";
        let i = 0;

        while (i < expression.length) {
            const char = expression[i];

            if (char === '(' || char === ')') {
                if (currentToken) {
                    tokens.push(currentToken);
                }
                tokens.push(char);
                currentToken = "";
            } else if (char === '&' || char === '|') {
                if (expression[i + 1] === char) {
                    if (currentToken) {
                        tokens.push(currentToken);
                    }
                    tokens.push(char + char);
                    currentToken = "";
                    i++;
                } else {
                    currentToken += char;
                }
            } else if (char === ' ') {
                if (currentToken === 'Not') {
                    const nextToken = expression.substring(i + 1, i + 1 + "Tested".length);
                    if (nextToken === "Tested") {
                        tokens.push("Not Tested");
                        i += "Tested".length;
                    }
                }
                else if (currentToken) {
                    tokens.push(currentToken);
                }
                currentToken = "";
            } else {
                currentToken += char;

                if (currentToken === "Not") {
                    const nextToken = expression.substring(i + 1, i + 1 + "Tested".length);
                    if (nextToken === "Tested") {
                        tokens.push("Not Tested");
                        currentToken = "";
                        i += "Tested".length;
                    }
                }
            }

            i++;
        }

        if (currentToken) {
            tokens.push(currentToken);
        }

        return tokens;
    }

    function evaluateExpression(tokens: string[]): State {
        const valuesStack: State[] = [];
        const operatorsStack: Operator[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            /*if (i == 0) {
                console.log('fresh tokens', {token, tokens});
            }*/
            if (token === '(') {
                const closingParenIndex = findClosingParenthesis(tokens, i);
                if (closingParenIndex === -1) {
                    throw new Error("Invalid expression: Missing closing parenthesis.");
                }
                const subExpression = tokens.slice(i + 1, closingParenIndex);
                const subExpressionResult = evaluateExpression(subExpression);
                const newTokens = [subExpressionResult.toString()];
                for (let j = closingParenIndex + 1; j < tokens.length; j++) {
                    newTokens.push(tokens[j]);
                }
                tokens = newTokens;
                i = -1;
            } else if (token === 'Pass' || token === 'Fail' || token === 'Not' || token === 'Tested' || token === 'Not Tested') {
                valuesStack.push(token === 'Not' ? 'Not Tested' : token as State);
            } else if (token in operatorPrecedence) {
                while (
                    operatorsStack.length &&
                    operatorPrecedence[operatorsStack[operatorsStack.length - 1]] >= operatorPrecedence[token as Operator]
                    ) {
                    applyOperator();
                }
                operatorsStack.push(token as Operator);
            }
        }

        while (operatorsStack.length) {
            applyOperator();
        }

        //console.log('return value stack[0]', { valuesStack, tokens });
        return valuesStack[0];

        function applyOperator() {
            const operator = operatorsStack.pop();
            const rightValue = valuesStack.pop();
            const leftValue = valuesStack.pop();
            const result = evaluateOperator(operator!, leftValue!, rightValue!);
            valuesStack.push(result);
        }
    }

    function findClosingParenthesis(tokens: string[], start: number): number {
        let count = 1;
        for (let i = start + 1; i < tokens.length; i++) {
            if (tokens[i] === '(') count++;
            if (tokens[i] === ')') count--;
            if (count === 0) return i;
        }
        return -1;
    }

    return evaluateExpression(tokenize(expression));
}

// Example usage:
const expression = "(Fail && Pass) || (Not Tested && Fail || Pass) && Pass || Fail && (Not Tested || Pass)";
console.log(evaluateSpecialBoolean(expression));
