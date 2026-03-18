import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class RegisterUserUseCase {
  RegisterUserUseCase(this._repository);

  final UserRepository _repository;

  Future<void> call({
    required String fullName,
    required String email,
    required String password,
    required int roleId,
  }) {
    return _repository.register(
      fullName: fullName,
      email: email,
      password: password,
      roleId: roleId,
    );
  }
}
