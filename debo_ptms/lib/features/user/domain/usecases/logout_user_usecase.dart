import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class LogoutUserUseCase {
  LogoutUserUseCase(this._repository);

  final UserRepository _repository;

  Future<void> call() {
    return _repository.logout();
  }
}
