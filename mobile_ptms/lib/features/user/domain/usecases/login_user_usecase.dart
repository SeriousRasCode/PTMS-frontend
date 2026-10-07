import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';
import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class LoginUserUseCase {
  LoginUserUseCase(this._repository);

  final UserRepository _repository;

  Future<UserEntity> call({required String email, required String password}) {
    return _repository.login(email: email, password: password);
  }
}
