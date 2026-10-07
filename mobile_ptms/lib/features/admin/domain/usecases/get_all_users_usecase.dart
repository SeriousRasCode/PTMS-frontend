import 'package:debo_ptms/features/admin/domain/entities/admin_user_entity.dart';
import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class GetAllUsersUseCase {
  const GetAllUsersUseCase(this._repository);

  final AdminRepository _repository;

  Future<List<AdminUserEntity>> call() {
    return _repository.getAllUsers();
  }
}
