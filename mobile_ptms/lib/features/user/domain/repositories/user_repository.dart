import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';

abstract class UserRepository {
  Future<UserEntity> login({required String email, required String password});

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required int roleId,
  });

  Future<UserEntity> getProfile();

  Future<UserEntity> updateProfile({
    required String fullName,
    required String email,
  });

  Future<void> logout();
}
