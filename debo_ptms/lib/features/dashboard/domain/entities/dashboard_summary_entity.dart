class DashboardSummaryEntity {
  const DashboardSummaryEntity({required this.values});

  final Map<String, dynamic> values;

  int metric(String key) {
    final value = values[key];
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
