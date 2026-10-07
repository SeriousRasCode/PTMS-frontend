import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';
import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class UpdateProfileUseCase {
  UpdateProfileUseCase(this._repository);

  final UserRepository _repository;

  Future<UserEntity> call({required String fullName, required String email}) {
    return _repository.updateProfile(fullName: fullName, email: email);
  }
}
