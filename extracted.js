$logPath = "C:\Users\ryuto\.gemini\antigravity-ide\brain\c99e9705-503a-41b0-ae94-ed3e38fbbfed\.system_generated\logs\transcript_full.jsonl"
$outFile = "C:\Users\ryuto\.gemini\web-joho1\（4章_プログラミング実践④）配列リスト工場サイバーデモ_新版\extracted.js"

Get-Content $logPath -Encoding UTF8 | ForEach-Object {
    try {
        $json = $_ | ConvertFrom-Json
        if ($json.type -eq "PLANNER_RESPONSE" -and $json.tool_calls) {
            foreach ($call in $json.tool_calls) {
                if ($call.name -eq "write_to_file" -and $call.args.CodeContent -match "const stepsData =") {
                    Set-Content -Path $outFile -Value $call.args.CodeContent -Encoding UTF8
                    Write-Output "Found in write_to_file, step $($json.step_index)"
                    return
                }
                if ($call.name -eq "run_command" -and $call.args.CommandLine -match "const stepsData =") {
                    Set-Content -Path $outFile -Value $call.args.CommandLine -Encoding UTF8
                    Write-Output "Found in run_command, step $($json.step_index)"
                    return
                }
                if ($call.name -eq "replace_file_content" -and $call.args.ReplacementContent -match "const stepsData =") {
                    Set-Content -Path $outFile -Value $call.args.ReplacementContent -Encoding UTF8
                    Write-Output "Found in replace_file_content, step $($json.step_index)"
                    return
                }
            }
        }
    } catch {
        # ignore parse errors
    }
}
Write-Output "Finished searching."

