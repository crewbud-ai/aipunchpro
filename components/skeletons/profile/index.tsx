import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton({ }) {
    return (
        // Loading State - Skeleton
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 xs:h-8 sm:h-9 bg-gray-200 rounded w-32 xs:w-36 sm:w-40 animate-pulse"></div>
                    <div className="h-3 xs:h-3.5 sm:h-4 bg-gray-200 rounded w-48 xs:w-56 sm:w-64 animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
                {/* Main Profile Card Skeleton - Left Side */}
                <div className="lg:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6">
                    {/* Personal Information Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 xs:pb-4 px-4 xs:px-5 sm:px-6">
                            <div className="space-y-2 flex-1 min-w-0">
                                <div className="h-5 xs:h-6 sm:h-7 bg-gray-200 rounded w-40 xs:w-48 sm:w-56 animate-pulse"></div>
                                <div className="h-3 xs:h-3.5 sm:h-4 bg-gray-200 rounded w-56 xs:w-64 sm:w-72 animate-pulse"></div>
                            </div>
                            <div className="h-8 xs:h-9 bg-gray-200 rounded w-16 xs:w-18 sm:w-20 animate-pulse flex-shrink-0 ml-2"></div>
                        </CardHeader>

                        <CardContent className="px-4 xs:px-5 sm:px-6">
                            {/* Avatar Section */}
                            <div className="flex items-center space-x-3 xs:space-x-4 mb-5 xs:mb-6">
                                <div className="h-16 w-16 xs:h-18 xs:w-18 sm:h-20 sm:w-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="h-5 xs:h-6 bg-gray-200 rounded w-32 xs:w-40 sm:w-48 animate-pulse"></div>
                                    <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-24 xs:w-28 sm:w-32 animate-pulse"></div>
                                    <div className="h-5 xs:h-6 bg-gray-200 rounded w-20 xs:w-24 animate-pulse"></div>
                                </div>
                            </div>

                            {/* Form Fields Skeleton */}
                            <div className="space-y-3 xs:space-y-4">
                                {/* Name Fields Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
                                    <div className="space-y-2">
                                        <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-20 xs:w-24 animate-pulse"></div>
                                        <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-20 xs:w-24 animate-pulse"></div>
                                        <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-24 xs:w-28 sm:w-32 animate-pulse"></div>
                                    <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 rounded w-48 xs:w-56 sm:w-64 animate-pulse"></div>
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-2">
                                    <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-24 xs:w-28 animate-pulse"></div>
                                    <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password Card Skeleton */}
                    <Card>
                        <CardHeader className="px-4 xs:px-5 sm:px-6">
                            <div className="space-y-2">
                                <div className="h-5 xs:h-6 sm:h-7 bg-gray-200 rounded w-36 xs:w-40 sm:w-48 animate-pulse"></div>
                                <div className="h-3 xs:h-3.5 sm:h-4 bg-gray-200 rounded w-52 xs:w-60 sm:w-72 animate-pulse"></div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-4 xs:px-5 sm:px-6">
                            <div className="space-y-3 xs:space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-4 xs:h-4.5 bg-gray-200 rounded w-28 xs:w-32 sm:w-36 animate-pulse"></div>
                                        <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                ))}

                                {/* Password Requirements Box */}
                                <div className="h-28 xs:h-32 bg-gray-100 border border-gray-200 rounded-lg animate-pulse"></div>

                                {/* Button */}
                                <div className="h-9 xs:h-10 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Skeletons - Right Side */}
                <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                    {/* Account Overview Skeleton */}
                    <Card>
                        <CardHeader className="px-4 xs:px-5 sm:px-6">
                            <div className="h-5 xs:h-6 bg-gray-200 rounded w-32 xs:w-36 sm:w-40 animate-pulse"></div>
                        </CardHeader>
                        <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="h-4 bg-gray-200 rounded w-24 xs:w-28 animate-pulse"></div>
                                        <div className="h-3.5 bg-gray-200 rounded w-32 xs:w-36 sm:w-40 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Company Info Skeleton */}
                    <Card>
                        <CardHeader className="px-4 xs:px-5 sm:px-6">
                            <div className="h-5 xs:h-6 bg-gray-200 rounded w-36 xs:w-40 sm:w-48 animate-pulse"></div>
                        </CardHeader>
                        <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="h-4 bg-gray-200 rounded w-20 xs:w-24 animate-pulse"></div>
                                        <div className="h-3.5 bg-gray-200 rounded w-28 xs:w-32 sm:w-36 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Contact Info Skeleton */}
                    <Card>
                        <CardHeader className="px-4 xs:px-5 sm:px-6">
                            <div className="h-5 xs:h-6 bg-gray-200 rounded w-36 xs:w-40 animate-pulse"></div>
                        </CardHeader>
                        <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="h-4 bg-gray-200 rounded w-16 xs:w-20 animate-pulse"></div>
                                        <div className="h-3.5 bg-gray-200 rounded w-36 xs:w-40 sm:w-48 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 