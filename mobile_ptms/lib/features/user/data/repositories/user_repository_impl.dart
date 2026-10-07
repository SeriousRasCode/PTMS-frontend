import 'package:debo_ptms/core/storage/token_storage.dart';
import 'package:debo_ptms/features/user/data/datasources/user_remote_data_source.dart';
import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';
import 'package:debo_ptms/features/user/domain/repositories/user_repository.dart';

class UserRepositoryImpl implements UserRepository {
  UserRepositoryImpl({
    required UserRemoteDataSource remoteDataSource,
    required TokenStorage tokenStorage,
  }) : _remoteDataSource = remoteDataSource,
       _tokenStorage = tokenStorage;

  final UserRemoteDataSource _remoteDataSource;
  final TokenStorage _tokenStorage;

  @override
  Future<UserEntity> login({
    required String email,
    required String password,
  }) async {
    final auth = await _remoteDataSource.login(
      email: email,
      password: password,
    );
    await _tokenStorage.saveToken(auth.token);
    return auth.user;
  }

  @override
  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required int roleId,
  }) async {
    await _remoteDataSource.register(
      fullName: fullName,
      email: email,
      password: password,
      roleId: roleId,
    );
  }

  @override
  Future<UserEntity> getProfile() {
    return _remoteDataSource.getProfile();
  }

  @override
  Future<UserEntity> updateProfile({
    required String fullName,
    required String email,
  }) {
    return _remoteDataSource.updateProfile(fullName: fullName, email: email);
  }

  @override
  Future<void> logout() async {
    await _tokenStorage.clearToken();
  }
}
