import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class ChangeUserStatusUseCase {
  const ChangeUserStatusUseCase(this._repository);

  final AdminRepository _repository;

  Future<void> call({required int userId, required bool isActive}) {
    return _repository.changeUserStatus(userId: userId, isActive: isActive);
  }
}
