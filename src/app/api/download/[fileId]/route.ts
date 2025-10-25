import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { readEncryptedFile } from "@/lib/fileStorage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get("download") === "true";

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the report/file by ID
    const report = await prisma.medicalReport.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        mimeType: true,
        fileUrl: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check access permissions
    if (user.role === "PATIENT") {
      // Patients can only access their own files
      if (report.userId !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (user.role === "DOCTOR") {
      // Doctors can access files of patients who granted them access
      const access = await prisma.doctorPatientAccess.findFirst({
        where: {
          doctorId: user.id,
          patientId: report.userId,
          status: "APPROVED",
        },
      });

      if (!access) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Read and decrypt the file using the fileUrl (which is the fileId)
    const decryptedData = await readEncryptedFile(report.fileUrl);

    // Determine content type
    const contentType = report.mimeType || "application/octet-stream";

    // Set headers
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", decryptedData.length.toString());
    
    if (forceDownload) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${report.fileName}"`
      );
    } else {
      headers.set(
        "Content-Disposition",
        `inline; filename="${report.fileName}"`
      );
    }

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(decryptedData as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
