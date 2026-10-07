import 'package:debo_ptms/features/admin/domain/entities/admin_team_entity.dart';
import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class GetAllTeamsUseCase {
  const GetAllTeamsUseCase(this._repository);

  final AdminRepository _repository;

  Future<List<AdminTeamEntity>> call() {
    return _repository.getAllTeams();
  }
}
