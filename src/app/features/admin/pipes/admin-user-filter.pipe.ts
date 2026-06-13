import { Pipe, PipeTransform } from '@angular/core';
import { AdminUser } from '../models/admin-user.model';

@Pipe({
  name: 'adminUserFilter',
  standalone: true
})
export class AdminUserFilterPipe implements PipeTransform {
  transform(users: AdminUser[] | null | undefined, query: string | null | undefined): AdminUser[] {
    if (!users?.length) {
      return [];
    }
    const normalized = query?.trim().toLowerCase();
    if (!normalized) {
      return users;
    }
    return users.filter((user) => {
      const login = user.login?.toLowerCase() ?? '';
      const email = user.email?.toLowerCase() ?? '';
      const role = user.role?.toLowerCase() ?? '';
      return login.includes(normalized) || email.includes(normalized) || role.includes(normalized);
    });
  }
}
