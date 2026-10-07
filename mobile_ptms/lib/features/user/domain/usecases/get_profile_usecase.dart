import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';
import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class GetProfileUseCase {
  GetProfileUseCase(this._repository);

  final UserRepository _repository;

  Future<UserEntity> call() {
    return _repository.getProfile();
  }
}
