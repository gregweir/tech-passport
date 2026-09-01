import { createRouter } from './router';
import { DashboardView } from './views/dashboard';
import { OnboardingView } from './views/onboarding';
import { PersonListView } from './views/person-list';
import { PersonEditView } from './views/person-edit';
import { DeviceListView } from './views/device-list';
import { DeviceEditView } from './views/device-edit';
import { AccountListView } from './views/account-list';
import { AccountEditView } from './views/account-edit';
import { BackupListView } from './views/backup-list';
import { BackupEditView } from './views/backup-edit';
import { RecoveryListView } from './views/recovery-list';
import { RecoveryEditView } from './views/recovery-edit';
import { DependencyListView } from './views/dependency-list';
import { DependencyEditView } from './views/dependency-edit';
import { ReviewListView } from './views/review-list';
import { PassportView } from './views/passport-view';
import { ExportImportView } from './views/export-import';
import { NotFoundView } from './views/not-found';

export const router = createRouter({
  '/': DashboardView,
  '/onboarding': OnboardingView,
  '/people': PersonListView,
  '/people/new': () => PersonEditView({ id: null }),
  '/people/:id/edit': (params) => PersonEditView({ id: params.id }),
  '/devices': DeviceListView,
  '/devices/new': () => DeviceEditView({ id: null }),
  '/devices/:id/edit': (params) => DeviceEditView({ id: params.id }),
  '/accounts': AccountListView,
  '/accounts/new': () => AccountEditView({ id: null }),
  '/accounts/:id/edit': (params) => AccountEditView({ id: params.id }),
  '/backups': BackupListView,
  '/backups/new': () => BackupEditView({ id: null }),
  '/backups/:id/edit': (params) => BackupEditView({ id: params.id }),
  '/recovery': RecoveryListView,
  '/recovery/new': () => RecoveryEditView({ id: null }),
  '/recovery/:id/edit': (params) => RecoveryEditView({ id: params.id }),
  '/dependencies': DependencyListView,
  '/dependencies/new': () => DependencyEditView({ id: null }),
  '/dependencies/:id/edit': (params) => DependencyEditView({ id: params.id }),
  '/reviews': () => ReviewListView(),
  '/passport': () => PassportView(),
  '/export': ExportImportView,
  '*': NotFoundView,
});
