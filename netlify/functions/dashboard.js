export async function handler(event, context) {
  const { httpMethod, path } = event;
  
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (httpMethod === 'GET' && path === '/api/teacher/dashboard') {
      // Mock teacher dashboard data
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          totalStudents: 70,
          totalSubjects: 6,
          attendanceRate: 85.2,
          pendingLeaves: 3,
          subjects: [
            { subjectName: "MCA-6206(i) Artificial Intelligence", attended: 58, total: 70, percentage: 82.9 },
            { subjectName: "Data Structures", attended: 62, total: 70, percentage: 88.6 },
            { subjectName: "Web Technologies", attended: 65, total: 70, percentage: 92.9 }
          ]
        })
      };
    }

    if (httpMethod === 'GET' && path === '/api/student/dashboard') {
      // Mock student dashboard data
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          overallPercentage: 62.5,
          subjects: [
            { subjectName: "MCA-6206(i) Artificial Intelligence", attended: 12, total: 20, percentage: 60 },
            { subjectName: "Data Structures", attended: 14, total: 20, percentage: 70 },
            { subjectName: "Web Technologies", attended: 13, total: 20, percentage: 65 }
          ]
        })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
