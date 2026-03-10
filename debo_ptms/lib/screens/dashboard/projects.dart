import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:debo_ptms/widgets/app_drawer.dart';

class Projects extends StatefulWidget {
  const Projects({super.key, required this.title});

  final String title;

  @override
  State<Projects> createState() => _ProjectsState();
}

class _ProjectsState extends State<Projects> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light,
        title: Text(
          "${widget.title}",
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F5841), Color(0xFF194F87)],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
          ),
        ),
      ),
      body: ListView.builder(
        itemCount: 10,
        itemBuilder: (context, index) {
          return InkWell(
            onTap: () {},
            enableFeedback: true,
            child: Container(
              margin: const EdgeInsets.all(10),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F5841), Color(0xFF194F87)],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
                borderRadius: BorderRadius.circular(10),
              ),

              child: Row(
                children: [
                  Icon(
                    Icons.folder,
                    size: 30,
                    color: const Color.fromARGB(255, 255, 255, 255),
                  ),
                  const SizedBox(width: 20),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Project ${index + 1}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color.fromARGB(255, 255, 255, 255),
                        ),
                      ),
                      Text(
                        'Description of project ${index + 1}',
                        style: TextStyle(
                          fontSize: 14,
                          color: const Color.fromARGB(255, 255, 255, 255),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_month,
                            size: 16,
                            color: const Color.fromARGB(255, 255, 255, 255),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'Due: 2024-12-31',
                            style: TextStyle(
                              fontSize: 12,
                              color: const Color.fromARGB(255, 255, 243, 243),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(
                            Icons.fiber_manual_record,
                            size: 16,
                            color: const Color.fromARGB(255, 255, 255, 255),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'Active',
                            style: TextStyle(
                              fontSize: 12,
                              color: const Color.fromARGB(255, 255, 243, 243),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
