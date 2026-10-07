import 'package:debo_ptms/features/admin/domain/entities/admin_team_entity.dart';
import 'package:debo_ptms/features/admin/domain/entities/admin_user_entity.dart';

abstract class AdminRepository {
  Future<List<AdminUserEntity>> getAllUsers();
  Future<void> changeUserStatus({required int userId, required bool isActive});
  Future<void> changeUserRole({required int userId, required String roleName});

  Future<List<AdminTeamEntity>> getAllTeams();
  Future<void> createTeam({required String name});
}
