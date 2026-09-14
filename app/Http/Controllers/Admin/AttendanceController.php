<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AttendanceLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index()
    {
        $logs = AttendanceLog::with('user')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('Admin/Attendance/Index', ['logs' => $logs]);
    }

    public function scan()
    {
        return Inertia::render('Admin/Attendance/Scan');
    }

    public function processScan(Request $request)
    {
        $validated = $request->validate([
            'qr_code' => 'required|string|exists:users,qr_code',
        ]);

        $user = User::where('qr_code', $validated['qr_code'])->first();
        if (!$user->is_employee) {
            return back()->withErrors(['qr_code' => 'User is not an employee.']);
        }

        // Check if there's an open log (time_in without time_out)
        $openLog = AttendanceLog::where('user_id', $user->id)
            ->whereNull('time_out')
            ->first();

        if ($openLog) {
            // Time-out
            $openLog->time_out = now();
            // Compute late if time_in > 8:00 AM (assume start 8 AM)
            $startOfDay = Carbon::parse($openLog->time_in)->setTime(8, 0);
            if ($openLog->time_in > $startOfDay) {
                $openLog->late_minutes = $openLog->time_in->diffInMinutes($startOfDay);
            }
            // Compute overtime if time_out > 5:00 PM (assume end 5 PM)
            $endOfDay = Carbon::parse($openLog->time_out)->setTime(17, 0);
            if ($openLog->time_out > $endOfDay) {
                $openLog->overtime_minutes = $endOfDay->diffInMinutes($openLog->time_out);
            }
            $openLog->save();
            $message = "Time-out recorded for {$user->name}.";
        } else {
            // Time-in
            AttendanceLog::create([
                'user_id' => $user->id,
                'time_in' => now(),
            ]);
            $message = "Time-in recorded for {$user->name}.";
        }

        return redirect()->route('admin.attendance.scan')->with('success', $message);
    }
}
