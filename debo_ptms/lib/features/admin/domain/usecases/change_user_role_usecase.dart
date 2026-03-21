import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class ChangeUserRoleUseCase {
  const ChangeUserRoleUseCase(this._repository);

  final AdminRepository _repository;

  Future<void> call({required int userId, required String roleName}) {
    return _repository.changeUserRole(userId: userId, roleName: roleName);
  }
}
