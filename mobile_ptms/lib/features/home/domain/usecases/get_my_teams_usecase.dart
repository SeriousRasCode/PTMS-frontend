import 'package:debo_ptms/features/home/domain/entities/home_team_entity.dart';
import 'package:debo_ptms/features/home/domain/repositories/home_repository.dart';

class GetMyTeamsUseCase {
  const GetMyTeamsUseCase(this._repository);

  final HomeRepository _repository;

  Future<List<HomeTeamEntity>> call() {
    return _repository.getMyTeams();
  }
}
