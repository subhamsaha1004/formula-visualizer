import { Component, Input } from '@angular/core';

interface Output {parts: any, expr: string}

interface UpdateParams {
  node: any,
  parent: any,
  relation: string,
  deleteDirection: string,
  operatorId: Number,
}

@Component({
  selector: 'formula-visualizer',
  templateUrl: './formula-visualizer.component.html',
  styleUrls: ['./formula-visualizer.component.scss']
})
export class FormulaVisualizerComponent {
  private _ast: any = {};
  astJson: string = '';
  visualizerOutput: string = '';
  formulaParts: any[] = [];
  private _selected: HTMLElement|null = null;
  private _basicOperators = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];

  @Input()
  get ast(): any {
    return this._ast;
  }
  set ast(syntaxTree: any) {
    if (!syntaxTree) return;

    const json = JSON.stringify(syntaxTree, null, 2);
    if (this.astJson == json) return;

    this._ast = syntaxTree;
    this.astJson = json;
    const result = this.parse(this._ast);
    this.formulaParts = result.parts;
    this.visualizerOutput = result.expr;
  }

  parse(node: any): Output {
    if (!node) return {parts: [], expr: ''};

    let left, right, operatorId;
    switch(node.type) {
      case 'NUMBER':
        const numVal = `${node.value}`;
        return {
          parts: numVal,
          expr: numVal,
        };
      case 'PI':
        return {
          parts: {type: 'CONSTANT', value: 'PI'},
          expr: `PI`,
        };
      case 'E':
        return {
          parts: {type: 'CONSTANT', value: 'E'},
          expr: `E`,
        };
      case 'VARIABLE':
        const nameVal = `${node.name}`
        return {
          parts: nameVal,
          expr: nameVal,
        };
      case 'NEGATION':
        const negRes = this.parse(node.expression);
        return {
          parts: ['-', negRes.parts],
          expr: `-${negRes.expr}`,
        };
      case 'POWER':
        const powExprRes = this.parse(node.expression);
        const powRes = this.parse(node.power);
        operatorId = this._getRandomId();
        node.id = operatorId;
        return {
          parts: [
            powExprRes.parts,
            {type: 'OPERATOR', value: '^', id: operatorId},
            powRes.parts,
          ],
          expr: `${powExprRes.expr} ^ ${powRes.expr}`,
        };
      case 'ADDITION':
        left = this.parse(node.left);
        right = this.parse(node.right);
        operatorId = this._getRandomId();
        node.id = operatorId;
        return {
          parts: [
            left.parts,
            {type: 'OPERATOR', value: '+', id: operatorId},
            right.parts,
          ],
          expr: `${left.expr} + ${right.expr}`,
        };
      case 'SUBTRACTION':
        left = this.parse(node.left);
        right = this.parse(node.right);
        operatorId = this._getRandomId();
        node.id = operatorId;
        return {
          parts: [
            left.parts,
            {type: 'OPERATOR', value: '-', id: operatorId},
            right.parts,
          ],
          expr: `${left.expr} - ${right.expr}`,
        };
      case 'MULTIPLICATION':
        left = this.parse(node.left);
        right = this.parse(node.right);
        operatorId = this._getRandomId();
        node.id = operatorId;
        return {
          parts: [
            left.parts,
            {type: 'OPERATOR', value: '*', id: operatorId},
            right.parts,
          ],
          expr: `${left.expr} * ${right.expr}`,
        };
      case 'DIVISION':
        left = this.parse(node.left);
        right = this.parse(node.right);
        operatorId = this._getRandomId();
        node.id = operatorId;
        return {
          parts: [
            left.parts,
            {type:'OPERATOR', value: '/', id: operatorId},
            right.parts,
          ],
          expr: `${left.expr} / ${right.expr}`,
        };
      case 'FUNCTION':
        const args = node.arguments.map((arg: any) => this.parse(arg));
        return {
          parts: [
            {type: 'FUNCTION', value: node.name},
            '(',
            ...args.map((res: Output) => res.parts),
            ')',
          ],
          expr: `${node.name}(${args.map((res: Output) => res.expr).join('')})`,
        }
      case 'PAREN':
        const result = this.parse(node.expression);
        const parenExprParts = this.isArray(result.parts) ? [...result.parts] : [result.parts];
        return {
          parts: ['(', ...parenExprParts, ')'],
          expr: `(${result.expr})`,
        };
      default:
        return {parts: [], expr: ''};
    }
  }

  private _getRandomId(): Number {
    return Math.floor(Math.random() * 100);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isSelectable(part: any): boolean {
    // Parenthesis, functions and operators are not selectable
    if (part.type === 'OPERATOR' || part.type === 'FUNCTION') return false;
    const value = part.type ? part.value : part;
    return !['(', ')'].includes(part);
  }

  selectNode(e: Event): void {
    this._clearSelection();
    const target = e.target as HTMLElement;
    this._selected = target.closest('.box.selectable');
    this._selected?.classList.add('selected');
  }

  deleteNode(): void {
    if (!this._selected) return;
    const parent = this._selected.parentElement as HTMLElement;
    // Find hierarchically closest descandant operator
    const operator = this._bfsDom(parent, '.operator', [this._selected]);
    if (!operator) {
      // If the subtree is not owned by an operator, don't allow delete
      alert('Delete not allowed for the selected node, formula may become invalid');
      this._clearSelection();
      return;
    }
    // This should be a sibling of the selected box
    const operatorBox = operator.closest('.box');
    const position = operatorBox?.compareDocumentPosition(this._selected);
    const deleteDirection = position == Node.DOCUMENT_POSITION_FOLLOWING ? 'right' : 'left';
    this._clearSelection();
    this._updateAst({
      node: this._ast,
      parent: null,
      relation: '',
      deleteDirection,
      operatorId: Number(operator.id),
    });
  }

  // Handles sub-tree deletion
  private _updateAst(params: UpdateParams): void {
    const {node, parent, relation, deleteDirection, operatorId} = params;

    // If matches, reparent the child to keep, matching node can only be an operator
    if (node.id == operatorId) {
      // deleteDirection denotes child to be deleted, so keep the opposite one
      let childToKeep;
      if(node.type == 'POWER') {
        childToKeep = deleteDirection == 'right' ? node.expression : node.power;
      } else {
        childToKeep = deleteDirection == 'right' ? node.left : node.right;
      }
      switch(relation) {
        case '':
          this._ast = childToKeep; // reassign root
          break;
        case 'arguments':
          parent[relation].length = 0;
          parent[relation].push(childToKeep);
          break;
        default:
          parent[relation] = childToKeep;
      }
      this.ast = this._ast; // re-render
      return;
    }
    // Recursively call update if node does not match
    if (this._basicOperators.includes(node.type)) {
      this._updateAst({
        node: node.left,
        parent: node,
        relation: 'left',
        deleteDirection,
        operatorId
      });
      this._updateAst({
        node: node.right,
        parent: node,
        relation: 'right',
        deleteDirection,
        operatorId
      });
    } else if (node.type == 'POWER') {
      this._updateAst({
        node: node.expression,
        parent: node,
        relation: 'expression',
        deleteDirection,
        operatorId
      });
      this._updateAst({
        node: node.power,
        parent: node,
        relation: 'power',
        deleteDirection,
        operatorId
      });
    } else if (node.type == 'PAREN') {
      this._updateAst({
        node: node.expression,
        parent: node,
        relation: 'expression',
        deleteDirection,
        operatorId
      });
    } else if (node.type == 'FUNCTION') {
      node.arguments.forEach((arg: any) => {
        this._updateAst({
          node: arg,
          parent: node,
          relation: 'arguments',
          deleteDirection,
          operatorId
        });
      });
    }
  }

  // Breadth-first search of dom nodes to find the first matching element
  private _bfsDom(
      root: HTMLElement,
      selector: string,
      exclude: Array<HTMLElement|null> = []): HTMLElement|null {
    if (!root) return null;
    let immediateChildren = Array.from(root.children)
        .filter((child) => !exclude.includes(child as HTMLElement));
    while (immediateChildren.length) {
      // Check the first layer children
      const match = immediateChildren.find((el) => el.matches(selector));
      if (match) return match as HTMLElement;
      // Replace with second layer and repeat the process till match is found
      immediateChildren = immediateChildren.reduce((acc: any, item) => {
        return acc.concat(Array.from(item.children));
      }, []);
    }
    // No match found
    return null;
  }

  private _clearSelection(): void {
    if (!this._selected) return;
    this._selected?.classList.remove('selected');
    this._selected = null;
  }
}