import 'package:debo_ptms/features/dashboard/domain/entities/dashboard_summary_entity.dart';
import 'package:debo_ptms/features/dashboard/domain/repositories/dashboard_repository.dart';

class GetDashboardSummaryUseCase {
  const GetDashboardSummaryUseCase(this._repository);

  final DashboardRepository _repository;

  Future<DashboardSummaryEntity> call({required bool isAdmin}) {
    return _repository.getSummary(isAdmin: isAdmin);
  }
}
