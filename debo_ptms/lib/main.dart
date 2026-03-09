import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Flutter Demo',
      theme: ThemeData(

        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {

    });
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: Text("Dashboard", 
        textAlign: TextAlign.center,
        style:TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 20
        )),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F5841), Color(0xFF194F87),],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
          ),
        ),
      ),
      body: 
            ListView.builder(
              itemCount: 10,
              itemBuilder: (context, index) {
                return InkWell(
                  onTap: () {
                    print("List CLicked");
                  },
                  enableFeedback: true,
                  child: Container(
                    margin: const EdgeInsets.all(10),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
              colors: [Color(0xFF0F5841), Color(0xFF194F87),],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
                      borderRadius: BorderRadius.circular(10),
                      
                    ),
                  
                    child:Row(
                      children:[
                        Icon(Icons.task_alt, size: 30, color: const Color.fromARGB(255, 255, 255, 255)),
                        const SizedBox(width: 20),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Task ${index + 1}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: const Color.fromARGB(255, 255, 255, 255))),
                            Text('Description of task ${index + 1}', style: TextStyle(fontSize: 14, color: const Color.fromARGB(255, 255, 255, 255))),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                               Icon(Icons.calendar_month, size: 16, color: const Color.fromARGB(255, 255, 255, 255)),
                                const SizedBox(width: 5),
                                Text('Due: 2024-12-31', style: TextStyle(fontSize: 12, color: const Color.fromARGB(255, 255, 243, 243))),
                                
                              ],
                            ),
                            const SizedBox(height: 5),
                            Row(
                              children: [
                               Icon(Icons.fiber_manual_record, size: 16, color: const Color.fromARGB(255, 255, 255, 255)),
                                const SizedBox(width: 5),
                                Text('Active', style: TextStyle(fontSize: 12, color: const Color.fromARGB(255, 255, 243, 243))),
                                
                              ],
                            )
                          ],
                        ),
                      ]
                    ),
                  ),
                );
              },
            ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder),
            label: 'Projects',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
