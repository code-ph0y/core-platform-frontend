export interface ContainerAttributes {
  [key: string]: any;
}

/**
 * Represents the JSON layout (or "schema") describing containers on a page.
 * This interface is recursive: each container can have children of type ContainerSchema.
 */
export interface ContainerSchema {
  container: string;
  children: ContainerSchema[];
  attributes: ContainerAttributes;
}
