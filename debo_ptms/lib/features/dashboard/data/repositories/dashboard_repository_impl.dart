import 'package:debo_ptms/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:debo_ptms/features/dashboard/domain/entities/dashboard_summary_entity.dart';
import 'package:debo_ptms/features/dashboard/domain/repositories/dashboard_repository.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  DashboardRepositoryImpl(this._remoteDataSource);

  final DashboardRemoteDataSource _remoteDataSource;

  @override
  Future<DashboardSummaryEntity> getSummary({required bool isAdmin}) async {
    final values = isAdmin
        ? await _remoteDataSource.getAdminSummary()
        : await _remoteDataSource.getManagerSummary();

    return DashboardSummaryEntity(values: values);
  }
}
