import 'package:debo_ptms/features/home/domain/entities/home_team_entity.dart';

abstract class HomeRepository {
  Future<List<HomeTeamEntity>> getMyTeams();
}
