import { CarotaNode, NodeType } from '../types';

/**
 * Base node prototype - all document tree nodes inherit from this
 */
export declare const nodePrototype: Omit<CarotaNode, 'type' | 'ordinal' | 'length' | '_left' | '_top'>;
/**
 * Additional method for finding parent of a specific type
 */
export declare function parentOfType(node: CarotaNode, type: NodeType): CarotaNode | null;
/**
 * Create a derived node type with additional methods
 *
 * @param methods - Additional methods to add to the node
 * @returns A new prototype with the node prototype and additional methods
 */
export declare function deriveNode<M extends object>(methods: M): typeof nodePrototype & M;
/**
 * Generic node interface with finalize method
 */
export interface GenericNode extends CarotaNode {
    _children: CarotaNode[];
    _parent: CarotaNode | null;
    finalize(startDecrement?: number, lengthIncrement?: number): void;
}
/**
 * Create a generic container node
 *
 * @param type - The node type
 * @param parent - The parent node
 * @param left - Optional left position (defaults to MAX_VALUE for auto-compute)
 * @param top - Optional top position (defaults to MAX_VALUE for auto-compute)
 * @returns A new generic node
 */
export declare function createGenericNode(type: NodeType, parent: CarotaNode | null, left?: number, top?: number): GenericNode;
export { nodePrototype as prototype };
export { createGenericNode as generic };
//# sourceMappingURL=Node.d.ts.map