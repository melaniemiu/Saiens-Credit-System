'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUp, Download, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface CSVImportDialogProps {
  type: 'users' | 'skills' | 'departments' | 'jobs';
  title: string;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: number;
  created: any[];
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ 
  type, 
  title, 
  onImportComplete 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: "檔案格式錯誤",
          description: "請選擇 CSV 格式的檔案",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadExample = async () => {
    try {
      await apiClient.downloadExample(type);
      toast({
        title: "範例檔案已下載",
        description: "請參考範例檔案格式來準備您的資料",
      });
    } catch (error) {
      toast({
        title: "下載失敗",
        description: error instanceof Error ? error.message : "無法下載範例檔案",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 300);

      let result;
      switch (type) {
        case 'users':
          result = await apiClient.importUsers(selectedFile);
          break;
        case 'skills':
          result = await apiClient.importSkills(selectedFile);
          break;
        case 'departments':
          result = await apiClient.importDepartments(selectedFile);
          break;
        case 'jobs':
          result = await apiClient.importJobs(selectedFile);
          break;
        default:
          throw new Error('Unknown import type');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setImportResult(result.results);
      
      toast({
        title: "匯入完成",
        description: result.message,
      });

      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      setUploadProgress(0);
      toast({
        title: "匯入失敗",
        description: error instanceof Error ? error.message : "匯入過程中發生錯誤",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setImportResult(null);
    setUploadProgress(0);
    setUploading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileUp className="h-4 w-4" />
          匯入 CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>匯入 {title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Download Example Section */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">下載範例檔案</p>
              <p className="text-xs text-gray-600">查看正確的 CSV 格式</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadExample}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              下載範例
            </Button>
          </div>

          {/* File Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="csv-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">點擊選擇檔案</span>
                  </p>
                  <p className="text-xs text-gray-500">僅支援 CSV 格式</p>
                </div>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>上傳進度</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-green-600">成功匯入</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.duplicates}
                  </div>
                  <div className="text-sm text-yellow-600">重複略過</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors.length}
                  </div>
                  <div className="text-sm text-red-600">錯誤</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">錯誤詳情</span>
                  </div>
                  <div className="text-xs text-red-600 max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="mb-1">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? '完成' : '取消'}
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  匯入中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  開始匯入
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;