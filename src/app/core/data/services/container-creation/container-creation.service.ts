import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { ContainerComponentInterface } from '../../../../page/page.component';

@Injectable({ providedIn: 'root' })
export class ContainerCreationService {
  /**
   * Dynamically creates a child container by lazily importing `container-map.ts`.
   *
   * Notes:
   * - Sets `attributes` and `children` on the created instance
   * - Calls `changeDetectorRef.detectChanges()` so the instance sees the values promptly
   */
  async createChild(
    childDef: ContainerComponentInterface,
    host: ViewContainerRef
  ): Promise<ComponentRef<any> | null> {
    if (!childDef || !host) return null;

    // Lazy load the container map
    const containerMapModule = await import('../../../plugins/containers/container-map');
    const compClass = (containerMapModule.containerMap as any)?.[childDef.container];

    if (!compClass) {
      console.warn(`[ContainerCreationService] No component found for: ${childDef.container}`);
      return null;
    }

    const compRef = host.createComponent(compClass);
    const instance = compRef.instance as ContainerComponentInterface;

    // Assign definition inputs
    instance.container = childDef.container;
    instance.attributes = childDef.attributes ?? {};
    instance.data = childDef.data;
    instance.children = Array.isArray(childDef.children) ? childDef.children : [];

    // Ensure bindings are applied immediately for dynamically created components
    compRef.changeDetectorRef.detectChanges();

    return compRef;
  }

  /**
   * Convenience helper: create many children in order.
   */
  async createChildren(
    defs: ContainerComponentInterface[] | undefined | null,
    host: ViewContainerRef
  ): Promise<ComponentRef<any>[]> {
    const out: ComponentRef<any>[] = [];
    const children = Array.isArray(defs) ? defs : [];
    for (const def of children) {
      const ref = await this.createChild(def, host);
      if (ref) out.push(ref);
    }
    return out;
  }
}
