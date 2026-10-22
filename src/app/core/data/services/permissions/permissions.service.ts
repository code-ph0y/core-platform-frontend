import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private userProfile: any;

  /**
   *  Check for permissions to edit.
   * @param currentModule
   * @param currentId
   */
  editPermissions(currentModule, currentId) {
    const moduleArray = currentModule.split("-");
    let permissionModule = moduleArray.map((module) => module.charAt(0).toUpperCase() + module.slice(1)).join(' ');

    return this.userProfile.permissions?.includes(permissionModule + ' - Edit All')
      || this.userProfile.permissions?.includes(permissionModule + ' - Edit Created By')
      || this.userProfile.permissions?.includes(permissionModule + ' - Edit Owned By');
  }

  /**
   * check to see if you have permission to delete a record,
   *
   * factor in if your in the users module and your record appears.
   *
   * @param currentModule
   * @param currentId
   */
  deletePermissions(currentModule, currentId) {
    if (currentModule === 'users' && currentId === this.userProfile.id) {
      return false;
    }
    const moduleArray = currentModule.split("-");
    let permissionModule = moduleArray.map((module) => module.charAt(0).toUpperCase() + module.slice(1)).join(' ');
    return this.userProfile.permissions?.includes(permissionModule + ' - Delete');
  }

  /**
   *
   */
  createPermissions(module: string, listActions: boolean = true) {
    const moduleArray: string[] = module.split("-");
    let permissionModule: string = moduleArray.map((module) => module.charAt(0).toUpperCase() + module.slice(1)).join(' ');

    return this.userProfile.permissions?.includes(permissionModule + ' - Create') && listActions !== false
  }

  /**
   * check for View permissions on profile.
   */
  viewPermissions(module: string, listActions: boolean = true) {
    const moduleArray: string[] = module.split("-");
    let permissionModule: string = moduleArray.map((module) => module.charAt(0).toUpperCase() + module.slice(1)).join(' ');

    return this.userProfile.permissions?.includes(permissionModule + ' - View All') && listActions !== false
  }

}
