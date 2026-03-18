import 'package:debo_ptms/features/home/data/datasources/home_remote_data_source.dart';
import 'package:debo_ptms/features/home/domain/entities/home_team_entity.dart';
import 'package:debo_ptms/features/home/domain/repositories/home_repository.dart';

class HomeRepositoryImpl implements HomeRepository {
  HomeRepositoryImpl(this._remoteDataSource);

  final HomeRemoteDataSource _remoteDataSource;

  @override
  Future<List<HomeTeamEntity>> getMyTeams() async {
    final rows = await _remoteDataSource.getMyTeams();
    return rows
        .map(
          (row) => HomeTeamEntity(
            id: _readInt(row['id']) ?? 0,
            name: (row['name'] ?? '').toString(),
          ),
        )
        .toList(growable: false);
  }

  int? _readInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '');
  }
}
