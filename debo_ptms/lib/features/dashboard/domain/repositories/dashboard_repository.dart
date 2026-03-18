import 'package:debo_ptms/features/dashboard/domain/entities/dashboard_summary_entity.dart';

abstract class DashboardRepository {
  Future<DashboardSummaryEntity> getSummary({required bool isAdmin});
}
