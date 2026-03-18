import 'package:debo_ptms/features/admin/domain/repositories/admin_repository.dart';

class CreateTeamUseCase {
  const CreateTeamUseCase(this._repository);

  final AdminRepository _repository;

  Future<void> call({required String name}) {
    return _repository.createTeam(name: name);
  }
}
