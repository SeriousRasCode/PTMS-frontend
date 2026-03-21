import 'package:debo_ptms/features/admin/data/datasources/admin_remote_data_source.dart';
import 'package:debo_ptms/features/admin/domain/entities/admin_team_entity.dart';
import 'package:debo_ptms/features/admin/domain/entities/admin_user_entity.dart';
import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class AdminRepositoryImpl implements AdminRepository {
  AdminRepositoryImpl(this._remoteDataSource);

  final AdminRemoteDataSource _remoteDataSource;

  @override
  Future<List<AdminUserEntity>> getAllUsers() async {
    final rows = await _remoteDataSource.getAllUsers();
    return rows
        .map(
          (row) => AdminUserEntity(
            id: _readInt(row['id']) ?? 0,
            fullName: (row['full_name'] ?? '').toString(),
            email: (row['email'] ?? '').toString(),
            role: (row['roles'] ?? '').toString(),
            isActive: _readBool(row['is_active']),
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> changeUserStatus({required int userId, required bool isActive}) {
    return _remoteDataSource.changeUserStatus(userId: userId, isActive: isActive);
  }

  @override
  Future<void> changeUserRole({required int userId, required String roleName}) {
    return _remoteDataSource.changeUserRole(userId: userId, roleName: roleName);
  }

  @override
  Future<List<AdminTeamEntity>> getAllTeams() async {
    final rows = await _remoteDataSource.getAllTeams();
    return rows
        .map(
          (row) => AdminTeamEntity(
            id: _readInt(row['id']) ?? 0,
            name: (row['name'] ?? '').toString(),
            createdBy: (row['created_by'] ?? '').toString(),
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> createTeam({required String name}) {
    return _remoteDataSource.createTeam(name: name);
  }

  int? _readInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '');
  }

  bool _readBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value == 1;
    return value?.toString().toLowerCase() == 'true';
  }
}
